/* eslint-disable */
import { Group, TextInput } from '@mantine/core';
import * as React from 'react';
import SafeSelect from '../SafeSelect';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';

interface Props {
    label: string
    filtersSet: { [key: string]: any }
    updateFilterSet: any
};

function generateItemFilter(label: string, operator: string, value: string) {
    function escapeRegExp(text: string) {
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    }

    const transform: any = {
        eq: { $eq: value },
        ne: { $ne: value },
        contains: { $regex: new RegExp(escapeRegExp(value), 'im') },
        not_contains: { $regex: new RegExp(`$^((?!${escapeRegExp(value)}).)*$`, 'im') },
    };

    return { [label]: transform[operator] };
}

export function StringFilter({ label, filtersSet, updateFilterSet, }: Props) {

    const form = useForm({
        initialValues: {
            Operator: 'eq',
            Value: '',
            Label: label,
        },
    });

    useEffect(function valuesChanges() {
        console.log('VALUES CHANGE')
        console.log(label)
        console.log(generateItemFilter(label, form.values.Operator, form.values.Value));
        updateFilterSet(generateItemFilter(label, form.values.Operator, form.values.Value));
    }, [form.values.Value, form.values.Operator]);


    return (
        <form>
            <Group noWrap>
                <SafeSelect
                    label="Operator"
                    data-test="string-filter-operators"
                    sx={{ width: '130px' }}
                    optionsData={[
                        { value: 'eq', label: 'equals' },
                        { value: 'ne', label: 'not equals' },
                        { value: 'contains', label: 'contains' },
                        { value: 'not_contains', label: 'not contains' },
                    ]}
                    {...form.getInputProps('Operator')}
                />
                <TextInput
                    label="Value"
                    {...form.getInputProps('Value')}
                />
            </Group>
        </form>
    );
};
