/* eslint-disable prefer-arrow-callback,indent,react/jsx-one-expression-per-line,no-nested-ternary */
import {
    ActionIcon,
    Group, List,
    Navbar,
    ScrollArea,
    Text,
} from '@mantine/core';
import * as React from 'react';
import {
    IconArrowsSort,
    IconFilter,
} from '@tabler/icons';
import { createStyles } from '@mantine/styles';
import { useEffect, useMemo, useState } from 'react';
import { useDebouncedValue, useToggle } from '@mantine/hooks';
import useInfinityScroll from '../../../shared/hooks/useInfinityScroll';

import { NavbarItems } from './NavbarItems';
import InfinityScrollSkeleton from './InfinityScrollSkeleton';
import SafeSelect from '../../../shared/components/SafeSelect';
import { NavbarSort } from './NavbarSort';
import { escapeRegExp } from '../../../shared/utils/utils';
import { useParams } from '../../hooks/useParams';
import { NavbarFilter } from './NavbarFilter';

const useStyles = createStyles((theme) => ({
    navbar: {
        backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.white,
        paddingLeft: theme.spacing.md,
        paddingRight: theme.spacing.xs,
        paddingTop: theme.spacing.sm,
        paddingBottom: theme.spacing.md,
    },
}));

export default function IndexNavbar() {
    const { classes } = useStyles();
    // const theme = useMantineTheme();

    const [sortOpened, setSortOpened] = useState(false);
    const [sortBy, setSortBy] = useState('createdDate');
    const [sortOrder, setSortOrder] = useState('desc');

    const { query, setQuery } = useParams();
    const [groupByValue, setGroupByValue] = useState(query.groupBy || 'runs');

    const handleGroupBySelect = (value: string) => {
        setGroupByValue(value);
        setQuery({ base_filter: {} });
    };

    const [quickFilter, setQuickFilter] = useState<string>('');
    const [debouncedQuickFilter] = useDebouncedValue(quickFilter, 400);

    const quickFilterKey = (value: string) => {
        const transform = {
            runs: 'name',
            suites: 'name',
            'test-distinct/browserName': 'browserName',
            'test-distinct/os': 'os',
            'test-distinct/status': 'status',
            'test-distinct/markedAs': 'markedAs',
        } as { [key: string]: string };
        return transform[value] || 'name';
    };

    const quickFilterObject = useMemo<{ [key: string]: any } | undefined>(() => {
        if (!debouncedQuickFilter) return ({});
        return ({ [quickFilterKey(groupByValue)]: { $regex: escapeRegExp(debouncedQuickFilter), $options: 'im' } });
    }, [debouncedQuickFilter]);
    // const baseFilter = query?.base_filter?.app
    //     ? {
    //         app: { $oid: query?.base_filter?.app || '' },
    //         ...quickFilterObject,
    //     }
    //     : {};

    const baseFilter = query?.app
        ? {
            app: { $oid: query?.app || '' },
            ...quickFilterObject,
        }
        : quickFilterObject;

    const [openedFilter, toggleOpenedFilter] = useToggle([false, true]);
    const [openedSort, toggleOpenedSort] = useToggle([false, true]);

    const getNewestFilter = (item: string) => {
        const transform = {
            runs: 'createdDate',
            suites: 'createdDate',
        };
        return transform[item as keyof typeof transform] || '';
    };

    const { firstPageQuery, infinityQuery } = useInfinityScroll({
        resourceName: groupByValue,
        // filterObj: JSON.parse(searchParams.get('filter')!),
        filterObj: query.filter,
        newestItemsFilterKey: getNewestFilter(groupByValue),
        baseFilterObj: baseFilter,
        sortBy: `${sortBy}:${sortOrder}`,
    });

    useEffect(function oneTime() {
        setQuery({ groupBy: groupByValue });

        firstPageQuery.refetch();
        // TODO: NAVBAR GroupBy select, remove, sort and filter icons
        //     updateToolbar(
        //         <ActionIcon
        //             title="Table settings, sorting, and columns visibility"
        //             color={theme.colorScheme === 'dark' ? 'green.8' : 'green.6'}
        //             data-test="table-sorting"
        //             variant="subtle"
        //             onClick={() => {
        //                 setSortOpen((prev) => !prev)
        //             }}
        //         >
        //             <IconAdjustments stroke={1} size={24} />
        //         </ActionIcon>,
        //         48
        //     );
        //
    }, []);

    useEffect(function onGroupByChange() {
        // console.log('onGroupByChange');
        // console.log({ groupByValue })
        // updateQueryJsonParamSection('groupBy', groupByValue);
        setQuery({ groupBy: groupByValue });
    }, [groupByValue]);

    useEffect(function refetch() {
        firstPageQuery.refetch();
    }, [
        query?.app,
        query?.groupBy,
        // query?.base_filter?.app,
        JSON.stringify(quickFilterObject),
        `${sortBy}:${sortOrder}`,
    ]);

    // useEffect(function addReloadIcon() {
    // TODO: NAVBAR toolbar refresh icon
    // updateToolbar(
    //     <RefreshActionIcon key="reload" newestItemsQuery={newestItemsQuery} firstPageQuery={firstPageQuery}
    //                        infinityQuery={infinityQuery} />,
    //     50
    // );
    // }, [newestItemsQuery?.data?.results.length, newestItemsQuery.status, theme.colorScheme]);

    // TODO Add remove icon
    // updateToolbar(
    //     <UnfoldActionIcon
    //         mounted={selection.length > 0}
    //         expandSelected={expandSelected}
    //         collapseSelected={collapseSelected}
    //     />,
    //     30,
    // );

    // useEffect(function onSearchParamsChanged() {
    //     firstPageQuery.refetch();
    //     // TODO remove groupByValue from this effect
    // }, [searchParams, groupByValue, JSON.stringify(baseFilter)]);

    return (
        <Group position="apart" align="start" noWrap>
            {
                (
                    <Navbar
                        height="100%"
                        width={{ sm: 350 }}
                        className={classes.navbar}
                        pt={0}
                        pr={2}
                        zIndex={10}
                        styles={{
                            root: {
                                zIndex: 20,
                            },
                        }}
                    >
                        <Navbar.Section
                            grow
                            component={ScrollArea}
                            styles={{ scrollbar: { marginTop: '74px' } }}
                            pr={16}
                        >
                            <Group position="apart" align="end" sx={{ width: '100%' }}>
                                <SafeSelect
                                    label="Group by"
                                    data-test="navbar-group-by"
                                    value={groupByValue}
                                    onChange={handleGroupBySelect}
                                    optionsData={[
                                        { value: 'runs', label: 'Runs' },
                                        { value: 'suites', label: 'Suites' },
                                        { value: 'test-distinct/browserName', label: 'Browsers' },
                                        { value: 'test-distinct/os', label: 'Platform' },
                                        // { value: 'test-distinct/viewport', label: 'Viewport' },
                                        { value: 'test-distinct/status', label: 'Test Status' },
                                        { value: 'test-distinct/markedAs', label: 'Accept Status' },
                                    ]}
                                />

                                <Group spacing={4}>
                                    <ActionIcon
                                        data-test="navbar-icon-open-filter"
                                        onClick={() => toggleOpenedFilter()}
                                        mb={4}
                                    >
                                        <IconFilter stroke={1} />
                                    </ActionIcon>
                                    <ActionIcon
                                        data-test="navbar-icon-open-sort"
                                        onClick={() => toggleOpenedSort()}
                                        mb={4}
                                    >
                                        <IconArrowsSort stroke={1} />
                                    </ActionIcon>
                                </Group>
                            </Group>

                            <Group>
                                <NavbarSort
                                    groupBy={groupByValue}
                                    setSortOpened={setSortOpened}
                                    sortBy={sortBy}
                                    setSortBy={setSortBy}
                                    setSortOrder={setSortOrder}
                                    sortOrder={sortOrder}
                                    openedSort={openedSort}
                                />
                            </Group>

                            <Group sx={{ width: '100%' }}>
                                <NavbarFilter
                                    openedFilter={openedFilter}
                                    quickFilter={quickFilter}
                                    setQuickFilter={setQuickFilter}
                                    debouncedQuickFilter={debouncedQuickFilter}
                                    infinityQuery={infinityQuery}
                                    toggleOpenedFilter={toggleOpenedFilter}
                                />
                            </Group>

                            {
                                infinityQuery.status === 'loading'
                                    // ? (<LoadingOverlay visible />)
                                    ? ('')
                                    : infinityQuery.status === 'error'
                                        ? (<Text color="red">Error: {infinityQuery.error.message}</Text>)
                                        : (
                                            <List size="md" listStyleType="none">
                                                {/* eslint-disable-next-line max-len */}
                                                <NavbarItems infinityQuery={infinityQuery} groupByValue={groupByValue} />
                                            </List>
                                        )
                            }
                            <InfinityScrollSkeleton infinityQuery={infinityQuery} />
                        </Navbar.Section>
                    </Navbar>
                )
            }
        </Group>
    );
}
