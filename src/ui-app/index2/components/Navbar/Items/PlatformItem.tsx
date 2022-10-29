/* eslint-disable no-underscore-dangle */
import * as React from 'react';
import { Group, List, Stack, Text, Tooltip } from '@mantine/core';
import { OsIcon } from '../../../../shared/components/Check/OsIcon';

interface Props {
    item: { [key: string]: string }
    index: number
    handlerItemClick: any
    className: string
}

export function PlatformItem({ item, index, handlerItemClick, className }: Props) {
    return (
        <List.Item
            data-test={`navbar_item_${index}`}
            onClick={handlerItemClick}
            className={className}
            sx={{ cursor: 'pointer', width: '100%' }}
        >
            <Group noWrap pl={8} position="apart" spacing={0} sx={{ width: '100%' }}>
                <Stack spacing={0} sx={{ width: '100%' }}>
                    <Group position="left" sx={{ width: '100%' }}>
                        <Tooltip label={item.name} multiline>
                            <Group spacing={8}>
                                <OsIcon os={item.name} size={20} />
                                <Text
                                    data-test="navbar-item-name"
                                    size={16}
                                    lineClamp={1}
                                    sx={{ wordBreak: 'break-all' }}
                                >
                                    {item.name}
                                </Text>
                            </Group>
                        </Tooltip>
                    </Group>
                </Stack>
            </Group>
        </List.Item>
    );
}
