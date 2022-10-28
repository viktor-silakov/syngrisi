/* eslint-disable prefer-arrow-callback,no-nested-ternary,no-underscore-dangle,react/jsx-one-expression-per-line */
import * as React from 'react';
import {
    ActionIcon,
    Group,
    LoadingOverlay,
    Modal,
    Stack,
    Text,
    useMantineTheme,
} from '@mantine/core';
import { useDisclosure, useLocalStorage } from '@mantine/hooks';
import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IconX } from '@tabler/icons';
import { useParams } from '../../../../hooks/useParams';
import { GenericService } from '../../../../../shared/services';
import { errorMsg } from '../../../../../shared/utils';
import { CheckDetails } from './CheckDetails/CheckDetails';
import { BrowserIcon } from '../../../../../shared/components/Check/BrowserIcon';
import { OsIcon } from '../../../../../shared/components/Check/OsIcon';
import { ViewPortLabel } from './ViewPortLabel';
import { sizes } from './checkSizes';
import { Status } from '../../../../../shared/components/Check/Status';

interface Props {
    firstPageQuery: any,
}

export function CheckModal({ firstPageQuery }: Props) {
    const { query, setQuery } = useParams();
    const [checksViewSize] = useLocalStorage({ key: 'check-view-size', defaultValue: 'medium' });
    const [checkModalOpened, checkModalHandlers] = useDisclosure(false);
    const closeHandler = () => {
        checkModalHandlers.close();
        setQuery({ checkId: null });
    };
    const { checkId } = query;
    const checkQuery = useQuery(
        [
            'check_for_modal',
            checkId,
        ],
        () => GenericService.get(
            'checks',
            { _id: checkId },
            {
                populate: 'baselineId,actualSnapshotId,diffId,test,suite,app',
                limit: '1',
            },
            'check_for_modal',
        ),
        {
            enabled: checkModalOpened,
            // enabled: false,
            refetchOnWindowFocus: false,
            onError: (e) => {
                errorMsg({ error: e });
            },
        },
    );

    const checkData: any = useMemo(
        () => checkQuery?.data?.results[0]!,
        [JSON.stringify(checkQuery?.data?.results)],
    );
    const theme = useMantineTheme();
    const iconsColor = useMemo(
        () => (theme.colorScheme === 'dark'
            ? theme.colors.gray[3]
            : theme.colors.dark[9]), [theme.colorScheme],
    );

    const title = useMemo(() => {
        if (checkData) {
            return (
                <Group position="apart">
                    <Group position="left" align="center" spacing="xs" sx={{ position: 'relative' }} noWrap>
                        <Text>
                            {checkData.app.name} / {checkData.suite.name} / {checkData.test.name} / {checkData?.name}
                        </Text>
                    </Group>

                    <Group spacing={8}>
                        <Group spacing={4}>
                            <Group spacing={2}>
                                {/* <Status size="lg" check={checkData} /> */}

                                <ActionIcon variant="light" size={32} p={4}>
                                    <OsIcon
                                        size={20}
                                        color={iconsColor}
                                        os={checkData.os}
                                    />
                                </ActionIcon>
                                <ActionIcon variant="light" size={32} p={4}>
                                    <BrowserIcon
                                        size={20}
                                        color={iconsColor}
                                        browser={checkData.browserName}
                                    />
                                </ActionIcon>
                            </Group>
                            <ViewPortLabel
                                check={checkData}
                                color={theme.colorScheme === 'dark' ? 'gray.2' : 'gray.8'}
                                sizes={sizes}
                                size="lg"
                                checksViewSize={checksViewSize}
                                fontSize="14px"
                            />

                        </Group>
                        <Status size="lg" check={checkData} />
                    </Group>

                    {/* <Group spacing={8}> */}

                    {/*    <ThemeIcon color="gray.3" variant="subtle" size={32} p={4} ml={8}> */}
                    {/*        <OsIcon */}
                    {/*            size={20} */}
                    {/*            os={checkData.os} */}
                    {/*        /> */}
                    {/*    </ThemeIcon> */}
                    {/*    <ThemeIcon color="gray.3" variant="subtle" size={32} p={4}> */}
                    {/*        <BrowserIcon */}
                    {/*            size={20} */}
                    {/*            browser={checkData.browserName} */}
                    {/*        /> */}
                    {/*    </ThemeIcon> */}
                    {/*    <ViewPortLabel */}
                    {/*        check={checkData} */}
                    {/*        color="gray.2" */}
                    {/*        sizes={sizes} */}
                    {/*        size="lg" */}
                    {/*        checksViewSize={checksViewSize} */}
                    {/*        fontSize="14px" */}
                    {/*    /> */}
                    {/*    <Status check={checkData} size="lg" /> */}
                    {/* </Group> */}
                </Group>

            );
        }
        return '';
    }, [checkData?._id]);

    useEffect(function onCheckIdChange() {
        if (query.checkId) {
            checkModalHandlers.open();
        }
    }, [query.checkId]);
    // const iframeSrc = query.checkId ? `/checkview2?id=${checkId}` : '';

    return (
        <Modal
            opened={checkModalOpened}
            centered
            title={title}
            size="auto"
            onClose={closeHandler}
            sx={{ marginTop: -25 }}
            styles={{ title: { width: '100%', paddingRight: 35 } }}
            withCloseButton={false}
        >
            {/* Close Button */}
            <ActionIcon
                style={{ position: 'fixed', right: 10, top: 10 }}
                onClick={
                    () => {
                        closeHandler();
                        checkModalHandlers.close();
                    }
                }
            >
                <IconX size={32} />
            </ActionIcon>

            {
                checkQuery.isLoading
                    ? (
                        <Stack mt={60}>
                            <LoadingOverlay visible />
                            <Text>Loading the data</Text>
                        </Stack>
                    )
                    : checkQuery.isError
                        ? (
                            <Stack mt={40}>
                                <Text color="red">Error load the check data</Text>
                            </Stack>
                        )
                        : checkData
                            ? (
                                <CheckDetails
                                    check={checkData}
                                    checkQuery={checkQuery}
                                    firstPageQuery={firstPageQuery}
                                    closeHandler={closeHandler}
                                />
                            )
                            : (
                                <Group mt={60}>
                                    Empty check data
                                </Group>
                            )

            }
        </Modal>
    );
}
