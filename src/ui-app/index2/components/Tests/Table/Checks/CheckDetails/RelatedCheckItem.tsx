/* eslint-disable no-underscore-dangle,react/jsx-one-expression-per-line */
import * as React from 'react';
import { Group, Image, Paper, useMantineTheme, Text, Stack, Badge, Tooltip } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { IconGitBranch } from '@tabler/icons';
import config from '../../../../../../config';
import { Status } from '../../../../../../shared/components/Check/Status';
import { ViewPortLabel } from '../ViewPortLabel';
import { sizes } from '../checkSizes';
import { BrowserIcon } from '../../../../../../shared/components/Check/BrowserIcon';
import { OsIcon } from '../../../../../../shared/components/Check/OsIcon';
import { PreviewCheckTooltipLabel } from '../PreviewCheckTooltipLabel';

interface Props {
    checkData: any
    setActiveCheckId: any
    activeCheckId: any
}

export function RelatedCheckItem({ checkData, activeCheckId, setActiveCheckId }: Props) {
    const check = checkData;
    const theme = useMantineTheme();
    const imageFilename = check.diffId?.filename || check.actualSnapshotId?.filename || check.baselineId?.filename;
    const imagePreviewSrc = `${config.baseUri}/snapshoots/${imageFilename}`;
    const [checksViewSize] = useLocalStorage({ key: 'check-view-size', defaultValue: 'medium' });

    const handleItemClick = () => {
        setActiveCheckId(() => check._id);
    };

    return (
        <Group
            onClick={handleItemClick}
            spacing={4}
            mt={8}
            mb={8}
            pr={8}
            pl={8}
            pt={8}
            pb={8}
            sx={{
                cursor: 'pointer',
                width: '88%',
                borderBottom: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[2]}`,
                // eslint-disable-next-line no-nested-ternary
                backgroundColor: (check._id === activeCheckId)
                    ? (theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[2])
                    : '',

                '&:hover': {
                    // border: `1px solid ${theme.colors.gray[3]}`,
                    backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[3],
                },
            }}
            position="center"

        >
            <Tooltip.Floating
                multiline
                zIndex={100}
                withinPortal
                position="right-start"
                color="dark"
                label={
                    <PreviewCheckTooltipLabel check={check} />
                }
            >
                <Paper
                    shadow="sm"
                    pr={4}
                    pl={4}
                    pt={4}
                    pb={4}
                >
                    <div
                        style={{ position: 'relative' }}
                        data-related-check-item={check.name}
                    >
                        <Stack align="center" mb={4}>
                            <Image
                                data-related-check="image"
                                src={imagePreviewSrc}
                                width="125px"
                                fit="contain"
                                withPlaceholder
                                alt={check.name}
                                styles={
                                    () => ({
                                        image: {
                                            maxHeight: 150,
                                        },
                                    })
                                }
                            />
                        </Stack>
                        <Stack p={8} align="start" spacing={8}>
                            <Group position="center" spacing={4} sx={{ width: '100%' }} noWrap>
                                <ViewPortLabel
                                    fontSize="8px"
                                    color="blue"
                                    check={check}
                                    sizes={sizes}
                                    checksViewSize={checksViewSize}
                                />
                                <Badge
                                    leftSection={<IconGitBranch style={{ marginTop: '4', marginRight: -2 }} size={9} />}
                                    color="dark"
                                    size="xs"
                                >
                                    <Text lineClamp={1} sx={{ maxWidth: 40 }} data-related-check="branch">
                                        {check.branch}
                                    </Text>
                                </Badge>
                            </Group>
                            <Group pl={8} position="center" spacing={4} sx={{ width: '100%' }} noWrap>
                                <OsIcon os={check.os} size={14} data-related-check="os-icon" />
                                <Text size="xs" lineClamp={1} data-related-check="os-label">{check.os}</Text>
                            </Group>

                            <Group pl={8} position="center" spacing={4} sx={{ width: '100%' }} noWrap>
                                <BrowserIcon data-related-check="browser-icon" browser={check.browserName} size={14} />
                                <Text
                                    size="xs"
                                    lineClamp={1}
                                    data-related-check="browser-name"
                                >
                                    {check.browserName}
                                </Text>
                                <Text
                                    data-related-check="browser-version"
                                    size="xs"
                                    sx={{ minWidth: '30%' }}
                                >
                                    - {check.browserVersion}
                                </Text>
                            </Group>
                        </Stack>

                        <div style={{ position: 'absolute', top: -14, left: 6, opacity: 1 }}>
                            <Status
                                data-related-check="status"
                                check={check}
                                size="xs"
                                variant="filled"
                            />
                        </div>
                    </div>
                </Paper>
            </Tooltip.Floating>
        </Group>
    );
}
