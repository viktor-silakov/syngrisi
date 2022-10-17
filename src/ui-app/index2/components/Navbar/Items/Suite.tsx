/* eslint-disable no-underscore-dangle */
import React, { useState } from 'react';
import {
    ActionIcon,
    Group,
    List,
    RingProgress,
    Stack,
    Text,
    Tooltip,
    Popover,
    Button,
} from '@mantine/core';
import { IconDotsVertical } from '@tabler/icons';
import { useDisclosure } from '@mantine/hooks';
import { useParams } from '../../../hooks/useParams';
import RemoveSuiteModalAsk from './RemoveSuiteModalAsk';

interface Props {
    item: { [key: string]: string }
    index: number
    classes: any
    id: string
    activeItem: string,
    setActiveItem: any,
    infinityQuery: any,
}

export function Suite(
    {
        item,
        index,
        classes,
        id,
        activeItem,
        setActiveItem,
        infinityQuery,
    }: Props,
) {
    const { setQuery } = useParams();
    const [opened, { toggle, close }] = useDisclosure(false);
    const [modalOpen, setModalOpen] = useState(false);

    const handleClick = () => {
        setModalOpen(true);
        close();
    };

    const handlerItemClick = () => {
        setActiveItem(() => id);
        setQuery({ base_filter: { suite: id } });
    };
    return (
        <>
            <List.Item
                data-test={`navbar_item_${index}`}
                onClick={handlerItemClick}
                className={
                    `${classes.navbarItem} ${(activeItem === id) && classes.activeNavbarItem}`
                }
                sx={{ cursor: 'pointer', width: '100%' }}
            >
                <Group
                    noWrap
                    pl={4}
                    position="apart"
                    spacing={0}
                >
                    <Group noWrap>
                        <Stack spacing={0}>
                            <Tooltip label={item.name} multiline>
                                <Text
                                    data-test="navbar-item-name"
                                    size={16}
                                    lineClamp={1}
                                    sx={{ wordBreak: 'break-all' }}
                                >
                                    {item.name}
                                </Text>
                            </Tooltip>
                            <Text align="right" size="xs" color="dimmed">3 hou!s ago</Text>
                        </Stack>
                    </Group>

                    <Group position="right" spacing={0}>
                        <RingProgress
                            sections={[{
                                value: 100,
                                color: 'orange',
                            }]}
                            size={48}
                        />

                        <Popover position="bottom" withArrow shadow="md" opened={opened} onChange={toggle}>
                            <Popover.Target>
                                <ActionIcon>
                                    <IconDotsVertical onClick={toggle} />
                                </ActionIcon>
                            </Popover.Target>
                            <Popover.Dropdown>
                                <Group position="center">
                                    <Button onClick={() => handleClick()}>Remove suite</Button>
                                </Group>
                            </Popover.Dropdown>
                        </Popover>
                    </Group>

                </Group>
            </List.Item>
            <RemoveSuiteModalAsk
                opened={modalOpen}
                setOpened={setModalOpen}
                infinityQuery={infinityQuery}
                item={item}
            />
        </>
    );
}
