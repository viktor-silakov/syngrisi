/* eslint-disable no-underscore-dangle,no-nested-ternary,prefer-arrow-callback */
import * as React from 'react';
import { ActionIcon, Group, ScrollArea, Stack, Text, Transition, Chip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconArrowsSort, IconCaretLeft, IconCaretRight, IconFilter, IconRefresh } from '@tabler/icons';
import { useEffect, useState } from 'react';
import { RelatedChecksSkeleton } from './RelatedChecksSkeleton';
import { RelatedChecksItems } from './RelatedChecksItems';
import { RelatedCheckSort } from './RelatedCheckSort';

interface Props {
    check: any
    related: any
}

export function RelatedChecks(
    {
        check,
        related,
    }: Props,
) {
    const [openedSort, sortHandler] = useDisclosure(false);
    const [openedFilter, filterHandler] = useDisclosure(false);
    const [filter, setFilter] = useState(['name']);

    useEffect(function onSortChange() {
        related.relatedChecksQuery.firstPageQuery.refetch();
    }, [`${related.sortBy}_${related.sortOrder}`]);

    const hideRelatedChecks = () => {
        sortHandler.close();
        filterHandler.close();
        related.handler.toggle();
    };

    useEffect(function onFilterChange() {
        const newFilter = filter.map((item) => ({ [item]: check[item] }));
        related.setRelatedFilter(() => ({
            $and: newFilter,
        }));
        related.relatedChecksQuery.firstPageQuery.refetch();
    }, [filter.length]);

    return (
        <Stack spacing={4} pr={0}>
            <Stack pr="sm" align="end" sx={{ width: '100%' }} spacing={8}>

                <Group position="apart" align="center" sx={{ width: '100%' }} spacing={0}>
                    <Group>
                        <ActionIcon
                            data-test="hide-related-checks-icon"
                            title="hide/show related checks"
                            onClick={() => hideRelatedChecks()}
                            // mb={4}
                        >

                            {related.opened ? (<IconCaretLeft stroke={1} />) : (
                                <IconCaretRight stroke={1} />)}
                        </ActionIcon>
                    </Group>
                    {
                        related.opened && (
                            <Group position="left" ml={-24}>
                                <Text size="sm">Related Checks</Text>
                            </Group>
                        )
                    }
                    <Group />
                </Group>

                {
                    related.opened && (
                        <Group position="right" spacing="xs" sx={{ width: '100%' }} mb={4}>
                            <ActionIcon
                                data-test="related-check-icon-open-sort"
                                onClick={() => sortHandler.toggle()}
                                mb={4}
                            >
                                <IconArrowsSort stroke={1} />
                            </ActionIcon>

                            <ActionIcon
                                data-test="related-check-icon-open-filter"
                                onClick={() => filterHandler.toggle()}
                                mb={4}
                            >
                                <IconFilter stroke={1} />
                            </ActionIcon>

                            <ActionIcon
                                data-test="related-check-icon-refresh"
                                onClick={() => related.relatedChecksQuery.firstPageQuery.refetch()}
                                mb={4}
                            >
                                <IconRefresh stroke={1} />
                            </ActionIcon>
                        </Group>
                    )
                }
                <RelatedCheckSort
                    toggleOpenedSort={sortHandler.toggle}
                    sortBy={related.sortBy}
                    setSortBy={related.setSortBy}
                    setSortOrder={related.setSortOrder}
                    sortOrder={related.sortOrder}
                    openedSort={openedSort}
                />
                {
                    openedFilter && (
                        <Group mb="xs" mt="xs" ml={-10} mr={-10} spacing={4}>
                            <Text size="sm" mb={-8}>
                                Show checks with same parameters
                            </Text>

                            <Chip.Group spacing={6} value={filter} onChange={setFilter} multiple>
                                <Chip size="xs" value="name">Name</Chip>
                                <Chip size="xs" value="Browser">Browser</Chip>
                                <Chip size="xs" value="browserVersion">Browser ver.</Chip>
                                <Chip size="xs" value="os">Platform</Chip>
                                <Chip size="xs" value="viewport">Viewport</Chip>
                                <Chip size="xs" value="branch">Branch</Chip>
                            </Chip.Group>
                        </Group>
                    )
                }

            </Stack>

            {
                related.opened && (
                    <Transition mounted={related.opened} transition="fade" duration={400} timingFunction="ease">
                        {
                            (styles: any) => (

                                <ScrollArea
                                    style={{ height: '75vh' }}
                                    styles={styles}
                                >
                                    {
                                        related.relatedChecksQuery.infinityQuery.isLoading
                                            ? (<RelatedChecksSkeleton num={5} infinityQuery={null} />)
                                            : (
                                                related.relatedChecksQuery.infinityQuery.isError
                                                    ? (<Text size="xs" color="red"> Fail to load</Text>)
                                                    : (
                                                        <Stack spacing={8}>
                                                            <RelatedChecksItems
                                                                infinityQuery={related.relatedChecksQuery.infinityQuery}
                                                                relatedActiveCheck={related.relatedActiveCheck}
                                                                setRelatedActiveCheck={related.setRelatedActiveCheck}
                                                            />
                                                        </Stack>
                                                    )
                                            )
                                    }

                                    <RelatedChecksSkeleton
                                        num={3}
                                        infinityQuery={related.relatedChecksQuery.infinityQuery}
                                    />
                                </ScrollArea>
                            )
                        }
                    </Transition>
                )
            }
        </Stack>
    );
}
