import * as React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { LIGHT } from '../../../styles/Colors';

interface Props {
    time: Date,
    setTime: (x: Date) => void
}

export const CustomTimeInput: React.FC<Props> = ({ time, setTime }: Props) => {
    const onChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (selectedDate) {
            setTime(selectedDate);
        }
    };

    return (
        <TouchableOpacity style={styles.container}>
            <DateTimePicker
                mode={"time"}
                value={time}
                onChange={onChange}
            />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        height: "80%",
        width: 100,
        backgroundColor: LIGHT,
    },
});
