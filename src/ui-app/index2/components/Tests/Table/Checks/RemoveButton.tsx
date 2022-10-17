/* eslint-disable no-underscore-dangle */
import * as React from 'react';
import { IconTrash } from '@tabler/icons';
import { useMutation } from '@tanstack/react-query';
import ActionPopoverIcon from '../../../../../shared/components/ActionPopoverIcon';
import { ChecksService } from '../../../../../shared/services';
import { errorMsg, successMsg } from '../../../../../shared/utils/utils';
import { log } from '../../../../../shared/utils/Logger';

interface Props {
    checksQuery: any,
    testUpdateQuery: any,
    check: any
}

export function RemoveButton({ checksQuery, testUpdateQuery, check }: Props) {
    const mutationRemoveCheck = useMutation(
        (data: { id: string }) => ChecksService.removeCheck(data),
        {
            onSuccess: async (result: any) => {
                successMsg({ message: 'Check has been successfully removed' });
                log.debug({ result });
                checksQuery.refetch();
                testUpdateQuery.refetch();
            },
            onError: (e: any) => {
                errorMsg({ error: 'Cannot remove the check' });
                log.error(e);
            },
        },
    );

    const handleRemoveCheckClick = () => {
        mutationRemoveCheck.mutate(
            {
                id: check._id,
            } as any,
        );
    };
    return (
        <ActionPopoverIcon
            testAttr="check-remove-icon"
            variant="subtle"
            icon={<IconTrash stroke={1} size={24} />}
            action={handleRemoveCheckClick}
            title="Delete check"
            loading={mutationRemoveCheck.isLoading}
            confirmLabel="Delete"
        />
    );
}