import { jsonQuotes } from "../../../data/jsonQuotes";
import { QuotationSchema } from "../constants/DataModels";
import { QuotationInterface } from "../constants/Interfaces";
import { strings } from "../constants/Strings";
import { dbName, defaultUsername } from "../constants/Values";
import { shuffle } from "./UtilFunctions";
import * as SQLite from "expo-sqlite";

export async function dataImporter() {
  const db = SQLite.openDatabase(dbName);

  const createTable = new Promise<void>((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS ${dbName} ( _id INTEGER PRIMARY KEY AUTOINCREMENT, quoteText TEXT, author TEXT, contributedBy TEXT, subjects TEXT, authorLink TEXT, videoLink TEXT, favorite BOOLEAN, deleted BOOLEAN);`,
        [],
        () => resolve(),
        (_, error) => {
          console.log(error);
          reject(error);
        }
      );
    });
  });

  await createTable;

  const isDbEmpty = await new Promise<boolean>((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT * FROM ${dbName}`,
        [],
        (_, result) => {
          resolve(result.rows.length === 0);
        },
        (_, error) => {
          console.log(error);
          reject(error);
        }
      );
    });
  });

  if (isDbEmpty) {
    const quotes: QuotationInterface[] = jsonQuotes.map((quote) => {
      return {
        _id: quote._id,
        quoteText: quote.quoteText,
        author: quote.author,
        contributedBy: quote.contributedBy,
        subjects: quote.subjects,
        authorLink: quote.authorLink,
        videoLink: quote.videoLink,
        favorite: false,
        deleted: false,
      };
    });

    const insertQuery = `INSERT INTO ${dbName} (quoteText, author, contributedBy, subjects, authorLink, videoLink, favorite, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    await new Promise<void>((resolve, reject) => {
      db.transaction((tx) => {
        quotes.forEach((quote) => {
          tx.executeSql(
            insertQuery,
            [
              quote.quoteText,
              quote.author,
              quote.contributedBy,
              quote.subjects,
              quote.authorLink,
              quote.videoLink,
              quote.favorite,
              quote.deleted,
            ],
            () => resolve(),
            (_, error) => {
              console.log(error);
              reject(error);
            }
          );
        });
      });
    });
  }
}

export async function getShuffledQuotes(
  key: string,
  filter: string
): Promise<QuotationInterface[]> {
  const db = SQLite.openDatabase(dbName);

  let query = `SELECT * FROM ${dbName}`;
  if (key === strings.customDiscoverHeaders.deleted) {
    query += ` WHERE deleted = 1 ORDER BY RANDOM()`;
  }
  else if (filter === strings.filters.author) {
    query += ` WHERE deleted = 0 AND author LIKE '%${key}%' ORDER BY RANDOM()`;
  } else if (filter === strings.filters.subject) {
    query += ` WHERE deleted = 0 AND subjects LIKE '%${key}%' ORDER BY RANDOM()`;
  } else {
    const string = `Invalid filter provided: ${filter}`;
    throw new Error(string);
  }

  return new Promise<QuotationInterface[]>((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        query,
        [],
        (_, result) => {
          const quotes: QuotationInterface[] = [];
          for (let i = 0; i < result.rows.length; i++) {
            quotes.push(result.rows.item(i));
          }
          resolve(quotes);
        },
        (_, error) => {
          console.log(error);
          reject(error);
        }
      );
    });
  });
}

export async function getFromDB(key: string): Promise<string[]> {
  const db = SQLite.openDatabase(dbName);
  switch (key) {
    case strings.filters.author:
      key = "author";
      break;
    case strings.filters.subject:
      key = "subjects";
      break;
    default:
      throw new Error("b Invalid filter provided");
  }
  const query = `SELECT DISTINCT "${key}" FROM ${dbName} ORDER BY "${key}" ASC`;

  return new Promise<string[]>((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        query,
        [],
        (_, result) => {
          const values = [];
          for (let i = 0; i < result.rows.length; i++) {
            const row = result.rows.item(i);
            const value = row[key];
            if (value) {
              values.push(value);
            }
          }
          resolve(values.sort());
        },
        (_, error) => {
          console.log(error);
          reject(error);
        }
      );
    });
  });
}

export async function getQuoteById(
  id: number
): Promise<QuotationInterface | null> {
  const db = SQLite.openDatabase(dbName);

  return new Promise<QuotationInterface | null>((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT * FROM ${dbName} WHERE _id = ?`,
        [id],
        (_, result) => {
          if (result.rows.length === 0) {
            resolve(null);
          } else {
            const quoteRow = result.rows.item(0);
            const quote: QuotationInterface = {
              ...quoteRow,
              favorite: quoteRow.favorite,
            };
            resolve(quote);
          }
        },
        (_, error) => {
          console.log(error);
          reject(error);
        }
      );
    });
  });
}

export const saveOrUpdateQuote = async (
  quote: QuotationInterface,
  existingQuote: boolean
) => {
  const db = SQLite.openDatabase(dbName);

  const query = existingQuote
    ? `UPDATE ${dbName} SET quoteText = ?, author = ?, subjects = ?, authorLink = ?, videoLink = ?, contributedBy = ?, favorite = ?, deleted = ? WHERE _id = ?`
    : `INSERT INTO ${dbName} (quoteText, author, subjects, authorLink, videoLink, contributedBy, favorite, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  const queryParams = [
    quote.quoteText,
    quote.author,
    quote.subjects,
    quote.authorLink,
    quote.videoLink,
    quote.contributedBy,
    quote.favorite,
    quote.deleted,
  ];

  if (existingQuote) {
    queryParams.push(quote._id);
  }

  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        query,
        queryParams,
        async (_, result) => {
          const fetchedQuote = await getQuoteById(quote._id);
          const isQuoteEqual =
            JSON.stringify(quote) === JSON.stringify(fetchedQuote);

          if (isQuoteEqual) {
            console.log("Quote saved or updated successfully");
            resolve(result);
          } else {
            console.log("Error: Fetched quote does not match the input quote");
            reject(new Error("Fetched quote does not match the input quote"));
          }
        },
        (_, error) => {
          console.log("Error saving or updating quote:", error);
          reject(error);
        }
      );
    });
  });
};

export const getAllQuotes = async (): Promise<QuotationInterface[]> => {
  const db = await SQLite.openDatabase(dbName);

  return new Promise<QuotationInterface[]>((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT * FROM ${dbName};`,
        [],
        (_, { rows }) => {
          const objs: QuotationInterface[] = rows["_array"];
          resolve(shuffle(objs));
        },
        (_, error) => reject(error)
      );
    });
  });
};

export const getQuotesContributedByMe = async (): Promise<
  QuotationInterface[]
> => {
  const db = await SQLite.openDatabase(dbName);

  return new Promise<QuotationInterface[]>((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT * FROM ${dbName} WHERE contributedBy = ?;`,
        [defaultUsername],
        (_, { rows }) => {
          const objs: QuotationInterface[] = rows["_array"];
          resolve(shuffle(objs));
        },
        (_, error) => reject(error)
      );
    });
  });
};

export const getFavoriteQuotes = async (): Promise<QuotationInterface[]> => {
  const db = SQLite.openDatabase(dbName);
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT * FROM ${dbName} WHERE favorite = 1`,
        [],
        (_, { rows }) => {
          const objs: QuotationInterface[] = rows["_array"];
          resolve(shuffle(objs));
        },
        (_, error) => {
          reject(error);
        }
      );
    });
  });
};

export async function getQuoteCount(
  key: string,
  filter: string
): Promise<number> {
  const db = SQLite.openDatabase(dbName);

  let query = "";
  let params: any[] = [];

  switch (filter) {
    case strings.filters.author:
      query = `SELECT COUNT(*) AS count FROM ${dbName} WHERE author = ? AND deleted = 0`;
      params = [key];
      break;
    case strings.filters.subject:
      query = `SELECT COUNT(*) AS count FROM ${dbName} WHERE subjects LIKE ? AND deleted = 0`;
      params = [`%${key}%`];
      break;
    case strings.customDiscoverHeaders.all:
      query = `SELECT COUNT(*) AS count FROM ${dbName} WHERE deleted = 0`;
      break;
    case strings.customDiscoverHeaders.addedByMe:
      query = `SELECT COUNT(*) AS count FROM ${dbName} WHERE contributedBy = ? AND deleted = 0`;
      params = [key];
      break;
    case strings.customDiscoverHeaders.favorites:
      query = `SELECT COUNT(*) AS count FROM ${dbName} WHERE favorite = 1 AND deleted = 0`;
      break;
    case strings.customDiscoverHeaders.top100 || "Top 100":
      query = `SELECT COUNT(*) AS count FROM ${dbName} WHERE subjects LIKE ? AND deleted = 0`;
      params = [`%${"Top 100"}%`];
      break;
    case strings.customDiscoverHeaders.deleted:
      query = `SELECT COUNT(*) AS count FROM ${dbName} WHERE deleted = 1`;
      break;
    default:
      break;
  }

  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        query,
        params,
        (_, result) => {
          resolve(result.rows.item(0).count);
        },
        (_, error) => {
          console.log(error);
          reject(error);
        }
      );
    });
  });
}


export const updateQuoteContainer = (
  quote: QuotationInterface,
  refreshRate: number,
  setQuote: (x: QuotationInterface) => void
) => {
  setInterval(async () => {
    try {
      // every 1/10 of a second, get the selected quote and make sure that the info that we're displaying to the user is correct. This makes sure that edits are displayed
      const mostUpToDateQuote: QuotationInterface = await getQuoteById(
        quote._id
      );
      setQuote(mostUpToDateQuote);
    } catch {
      console.log("Error: couldn't update quote");
    }
  }, refreshRate);
};

export const updateQuote = async (updatedQuote: QuotationInterface) => {
  const db = SQLite.openDatabase(dbName);
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `UPDATE ${dbName} SET favorite = ? WHERE _id = ?`,
        [updatedQuote.favorite, updatedQuote._id],
        (_, { rowsAffected }) => {
          if (rowsAffected > 0) {
            resolve(true);
          } else {
            reject(new Error("Error updating quote"));
          }
        },
        (_, error) => {
          reject(error);
        }
      );
    });
  });
};

export async function markQuoteAsDeleted(quote: QuotationInterface, shouldDelete: boolean) {
  const db = SQLite.openDatabase(dbName);

  const query = `UPDATE ${dbName} SET deleted = ? WHERE _id = ?`;
  const params = [shouldDelete ? 1 : 0, quote._id]; // Here we set the 'deleted' field to 1 if shouldDelete is true, and 0 otherwise.

  return new Promise<void>((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        query,
        params,
        () => resolve(),
        (_, error) => {
          console.log(error);
          reject(error);
        }
      );
    });
  });
}

