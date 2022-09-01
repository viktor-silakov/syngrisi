/* eslint-disable */
import React, { FunctionComponent } from 'react';
import { ActionIcon, Badge, Group, useMantineTheme } from '@mantine/core';
import { IconRefresh } from '@tabler/icons';

interface Props {
    newestItemsQuery: any,
    firstPageQuery: any,
    infinityQuery?: any,
}

const Toolbar: FunctionComponent<Props> = ({ newestItemsQuery, firstPageQuery, infinityQuery }) => {
    const theme = useMantineTheme();
    const newestItems = newestItemsQuery?.data?.results.length > 50 ? '50+' : newestItemsQuery?.data?.results.length;
    const pluralCharset = newestItems > 1 ? 's' : '';
    return (
        <>
            <Group position="right" spacing={1} pr={16}>
                <ActionIcon
                    color={theme.colorScheme === 'dark' ? 'green.8' : 'green.6'}

                    variant="subtle"
                    onClick={() => firstPageQuery.refetch()}
                >
                    <IconRefresh size={24} />

                    {
                        newestItemsQuery?.data?.results?.length !== undefined && newestItemsQuery?.data?.results?.length > 0
                        && (
                            <Badge
                                component="div"
                                title={` You have ${newestItems} new item${pluralCharset}, refresh the page to see them`}
                                pl={4}
                                pr={4}
                                pt={6}
                                pb={6}
                                color="red"
                                variant="filled"
                                radius="xl"
                                sx={{
                                    fontSize: '12px',
                                    // height: '16px!important',
                                    position: 'absolute',
                                    bottom: 11,
                                    left: 14,
                                    lineHeight: '16px',
                                    fontWeight: 400,
                                    fontFamily: '"Roboto","Arial",sans-serif',
                                    border: `2px`,
                                    borderStyle: 'solid',
                                    borderColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : 'white',
                                }}
                            >
                                {
                                    newestItems
                                }
                            </Badge>
                        )
                    }
                </ActionIcon>
            </Group>
        </>
    );
};

export default Toolbar;
