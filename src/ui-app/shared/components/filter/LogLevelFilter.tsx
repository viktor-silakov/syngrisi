/* eslint-disable */
import { Group } from '@mantine/core';
import * as React from 'react';
import { useEffect } from 'react';
import SafeSelect from '../SafeSelect';
import { useForm } from '@mantine/form';
import { generateItemFilter } from '../../utils';
import { useQuery } from '@tanstack/react-query';
import { LogsService } from '../../services/logs.service';

interface Props {
    label: string
    groupRules: { [key: string]: any }
    updateGroupRules: any
    id: string
}

export function LogLevelFilter({ label, groupRules, updateGroupRules, id }: Props) {

    const distinctQuery = useQuery(
        ['logs_level_distinct'],
        () => LogsService.distinct('level'),
        {
            enabled: true,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            onSuccess: (data) => {
                form.values.value = data[0];
            }
        },
    )
    let levels: { value: string, label: string }[] = [];
    if (distinctQuery.isSuccess && distinctQuery.data) {
        levels = distinctQuery.data.map((item) => ({ value: item, label: item }))
    }

    distinctQuery.isLoading ? ['loading'] : distinctQuery.data;

    if (distinctQuery.error) levels = [{ value: '', label: 'error loading levels' }];

    const form = useForm({
        initialValues: {
            operator: 'eq',
            value: distinctQuery.data ? distinctQuery.data[0] : '',
            label: label,
        },
        validateInputOnChange: true,
    });

    useEffect(function valuesChanges() {
        updateGroupRules(id, generateItemFilter(label, form.values.operator, form.values.value));
    }, [form.values.value, form.values.operator, label]);

    return (
        <form>
            <Group align="start" noWrap>
                <SafeSelect
                    label=""
                    data-test="string-filter-operators"
                    sx={{ width: '130px' }}
                    optionsData={[
                        { value: 'eq', label: 'equals' },
                        { value: 'ne', label: 'not equals' },
                        { value: 'contains', label: 'contains' },
                        { value: 'not_contains', label: 'not contains' },
                    ]}
                    {...form.getInputProps('operator')}
                />

                <SafeSelect
                    label=""
                    data-test="string-filter-operators"
                    sx={{ width: '130px' }}
                    title={form.getInputProps('value').value}
                    optionsData={levels}
                    loaded={distinctQuery.isLoading}
                    {...form.getInputProps('value')}
                />
            </Group>
        </form>
    );
}