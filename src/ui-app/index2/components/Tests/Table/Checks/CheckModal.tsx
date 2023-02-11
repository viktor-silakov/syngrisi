/* eslint-disable prefer-arrow-callback,no-nested-ternary,no-underscore-dangle,react/jsx-one-expression-per-line,max-len */
import * as React from 'react';
import {
    ActionIcon,
    Group,
    LoadingOverlay,
    Modal,
    Stack,
    Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IconX } from '@tabler/icons';
import { useParams } from '../../../../hooks/useParams';
import { GenericService } from '../../../../../shared/services';
import { errorMsg } from '../../../../../shared/utils';
import { CheckDetails } from './CheckDetails/CheckDetails';

export function CheckModal() {
    const { query, setQuery } = useParams();
    const [checkModalOpened, checkModalHandlers] = useDisclosure(false);

    const [initCheckId, setInitCheckId] = useState<string>('');
    useEffect(function onCheckIdChange() {
        if (query.checkId && query.modalIsOpen === 'true') {
            setInitCheckId(query.checkId);
            checkModalHandlers.open();
        }
    }, [query.modalIsOpen]);

    const closeHandler = () => {
        checkModalHandlers.close();
        setQuery({ checkId: undefined });
        setQuery({ modalIsOpen: undefined });
        setInitCheckId('');
    };

    const checkQuery = useQuery(
        {
            queryKey: [
                'check_for_modal',
                initCheckId,
            ],
            queryFn: () => GenericService.get(
                'checks',
                { _id: initCheckId },
                {
                    populate: 'baselineId,actualSnapshotId,diffId,test,suite,app',
                    limit: '1',
                },
                'initial_check_for_check_details_modal',
            ),
            enabled: checkModalOpened,
            refetchOnWindowFocus: false,
            onError: (e) => {
                errorMsg({ error: e });
            },
        },
    );

    const checkData = checkQuery?.data?.results[0]!;
    return (
        <Modal
            className="modal"
            opened={checkModalOpened}
            centered
            size="auto"
            onClose={closeHandler}
            sx={{ marginTop: -25 }}
            styles={{ title: { width: '100%', paddingRight: 35 } }}
            withCloseButton={false}
        >
            {/* Close Button */}
            <ActionIcon
                data-test="close-check-detail-icon"
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
                checkQuery.isLoading && !checkData
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
                                    initCheckData={checkData}
                                    checkQuery={checkQuery}
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
