/* eslint-disable no-underscore-dangle,react/jsx-one-expression-per-line,prefer-arrow-callback */
import * as React from 'react';
import { fabric } from 'fabric';
import {
    ActionIcon,
    Group,
    Paper,
    SegmentedControl,
    Stack,
    Text,
    Button,
    useMantineTheme,
    Popover,
    Divider,
} from '@mantine/core';
import { useDisclosure, useViewportSize } from '@mantine/hooks';
import { useContext, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    IconArrowsExchange2,
    IconChevronDown,
    IconDeviceFloppy,
    IconShape,
    IconSquareHalf,
    IconSquareLetterA,
    IconSquareLetterE, IconZoomIn, IconZoomOut,
} from '@tabler/icons';
import { MainView } from './mainView';
import { imageFromUrl } from './helpers';
import { errorMsg, log } from '../../../../../../shared/utils';
import { GenericService } from '../../../../../../shared/services';
import config from '../../../../../../config';
import { AcceptButton } from '../AcceptButton';
import { RemoveButton } from '../RemoveButton';
import { AppContext } from '../../../../../AppContext';
import { RelatedChecks } from './RelatedChecks';
import { useRelatedChecks } from './hooks/useRelatedChecks';

function onImageErrorHandler(...e: any) {
    const imgSrc = e[0].path[0].src;
    const msg = `Cannot load image: '${imgSrc}'`;
    log.error(msg, e);
    errorMsg({ error: msg });
}

function createImageAndWaitForLoad(src: string) {
    const timeout = 90000;
    const img = new Image();
    img.addEventListener('error', onImageErrorHandler);
    img.src = src;
    return Promise.race([
        new Promise((resolve, reject) => {
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(e);
        }),
        new Promise((_, reject) => {
            setTimeout(
                () => reject(
                    new Error(`The image loading timeout is exceeded: '${timeout}' milliseconds, src: '${src}'`),
                ),
                timeout,
            );
        }),
    ]);
}

interface Props {
    checkData: any,
    checkQuery: any,
    firstPageQuery: any,
    closeHandler: any,
}

export function CheckDetails({ checkData, checkQuery, firstPageQuery, closeHandler }: Props) {
    const { setAppTitle }: any = useContext(AppContext);
    const [relatedChecksOpened, relatedChecksHandler] = useDisclosure(true);

    const related = useRelatedChecks(checkData);
    related.opened = relatedChecksOpened;
    related.handler = relatedChecksHandler;
    const currentCheck = useMemo(
        () => related.relatedFlatChecksData.find((x) => x._id === related.relatedActiveCheck) || checkData,
        [related.relatedActiveCheck],
    );

    const theme = useMantineTheme();
    setAppTitle(currentCheck.name);

    const { height: vHeight, width: vWidth } = useViewportSize();
    const [mainView, setMainView] = useState(null);
    const [zoomPercent, setZoomPercent] = useState(100);
    const [openedZoomPopover, zoomPopoverHandler] = useDisclosure(false);

    function zoomEvents() {
        mainView.canvas.on('mouse:wheel', (opt: any) => {
            if (!opt.e.ctrlKey) return;
            const delta = opt.e.deltaY;
            let zoomVal = mainView.canvas.getZoom();

            zoomVal *= 0.999 ** delta;
            if (zoomVal > 9) zoomVal = 9;
            if (zoomVal < 0.10) zoomVal = 0.10;
            mainView.canvas.zoomToPoint({
                x: opt.e.offsetX,
                y: opt.e.offsetY,
            }, zoomVal);

            setZoomPercent(() => zoomVal * 100);
            document.dispatchEvent(new Event('zoom'));
            opt.e.preventDefault();
            opt.e.stopPropagation();
        });
    }

    const zoomByPercent = (percent) => {
        if (!mainView?.canvas) return;
        // mainView.canvas.zoomToPoint(new fabric.Point(mainView.canvas.width / 2,
        //     30), zoomPercent / 100);
        mainView.canvas.setZoom(percent / 100);
        mainView.canvas.renderAll();
        setZoomPercent(() => percent);
    };

    const zoomByDelta = (delta: number) => {
        document.dispatchEvent(new Event('zoom'));
        let newPercent = Math.round(mainView.canvas.getZoom() * 100) + delta;
        newPercent = newPercent < 2 ? 2 : newPercent;
        newPercent = newPercent > 1000 ? 1000 : newPercent;
        // console.log({ newRatio })

        zoomByPercent(newPercent);
    };

    const baselineQuery = useQuery(
        [
            'baseline_by_snapshot_id',
            currentCheck.baselineId._id,
        ],
        () => GenericService.get(
            'baselines',
            { snapshootId: currentCheck.baselineId._id },
            {
                populate: 'app',
                limit: '1',
            },
            'baseline_by_snapshot_id',
        ),
        {
            enabled: true,
            refetchOnWindowFocus: false,
            onError: (e) => {
                errorMsg({ error: e });
            },
        },
    );

    const baselineId = useMemo(() => {
        if (baselineQuery.data?.results && baselineQuery.data?.results.length > 0) {
            return baselineQuery.data?.results[0]._id;
        }
        return null;
    }, [JSON.stringify(baselineQuery.data?.results)]);

    useEffect(function destroyMainView() {
        if (mainView) {
            mainView.destroyAllViews();
            mainView.canvas.clear();
            mainView.canvas.dispose();
            setMainView(null);
        }
    }, [related.relatedActiveCheck, relatedChecksOpened]);

    useEffect(() => {
        const initMV = async () => {
            fabric.Object.prototype.objectCaching = false;
            const baselineImgSrc = `${config.baseUri}/snapshoots/${currentCheck?.baselineId?.filename}?expectedImg`;
            const baselineImg = await createImageAndWaitForLoad(baselineImgSrc);

            const actual = currentCheck.actualSnapshotId || null;
            const actualImgSrc = `${config.baseUri}/snapshoots/${currentCheck?.actualSnapshotId?.filename}?actualImg`;
            const actualImg = await createImageAndWaitForLoad(actualImgSrc);

            // eslint-disable-next-line max-len
            document.getElementById('snapshoot').style.height = `${MainView.calculateExpectedCanvasViewportAreaSize().height - 10}px`;

            const expectedImage = await imageFromUrl(baselineImg.src);
            const actualImage = await imageFromUrl(actualImg.src);

            const diffImgSrc = `${config.baseUri}/snapshoots/${currentCheck?.diffId?.filename}?diffImg`;
            const diffImage = currentCheck?.diffId?.filename ? await imageFromUrl(diffImgSrc) : null;

            await setMainView((prev: any) => {
                if (prev) return prev;
                const MV = new MainView(
                    {
                        canvasId: '2d',
                        canvasElementWidth: document.getElementById('snapshoot')!.clientWidth,
                        canvasElementHeight: document.getElementById('snapshoot')!.clientHeight,
                        expectedImage,
                        actualImage,
                        diffImage,
                        actual,
                    },
                );
                window.mainView = MV;
                return MV;
            });
        };
        setTimeout(() => {
            initMV();
        }, 10)

    }, [related.relatedActiveCheck, relatedChecksOpened]);

    useEffect(function afterMainViewCreatedHandleRegions() {
        if (!baselineId) return;
        if (mainView) {
            mainView.getSnapshotIgnoreRegionsDataAndDrawRegions(baselineId);
        }
    }, [
        JSON.stringify(baselineQuery.data?.results),
        mainView?.toString(),
    ]);

    /**
     * Calculates the biggest baseline or actual image dimension
     * for example: expectedImage {width: 100, height: 200}, actualImage: {width: 200, height: 300}
     * the function will return ['actualImage', 'height' ]
     */
    const calculateMaxImagesDimensions = () => {
        const data: any = [
            { imageName: 'expectedImage', dimension: 'width', value: mainView.expectedImage.width },
            { imageName: 'expectedImage', dimension: 'height', value: mainView.expectedImage.height },
            { imageName: 'actualImage', dimension: 'width', value: mainView.actualImage.width },
            { imageName: 'actualImage', dimension: 'height', value: mainView.actualImage.height },
        ];
        const biggestDimensionValue = Math.max(...data.map((x: any) => x.value));

        const result = data.find((x: any) => x.value === biggestDimensionValue);
        return result;
    };

    const zoomTo = (image: any, dimension: string) => {
        // console.log(mainView.canvas.getZoom());
        const ratio = mainView.canvas[dimension] / image[dimension];
        const percent = ratio > 9 ? 900 : ratio * 100;
        zoomByPercent(percent);
        mainView.canvas.renderAll();
    };

    const fitGreatestImageIfNeeded = () => {
        const greatestImage = calculateMaxImagesDimensions();
        zoomTo(mainView[greatestImage.imageName], greatestImage.dimension);

        const anotherDimension = (greatestImage.dimension === 'height') ? 'width' : 'height';

        if (mainView[greatestImage.imageName][anotherDimension] > mainView.canvas[anotherDimension]) {
            zoomTo(mainView[greatestImage.imageName], anotherDimension);
        }

        // initial pan
        setTimeout(() => {
            mainView.panToCanvasWidthCenter(greatestImage.imageName);
        }, 10);
    };

    const fitImageIfNeeded = (imageName) => {
        const image = mainView[imageName];
        const greatestDimension = (image.height > image.width) ? 'height' : 'width';

        const anotherDimension = (greatestDimension === 'height') ? 'width' : 'height';

        zoomTo(image, greatestDimension);

        if (mainView[imageName][anotherDimension] > mainView.canvas[anotherDimension]) {
            zoomTo(mainView[imageName], anotherDimension);
        }

        setTimeout(() => {
            mainView.panToCanvasWidthCenter(imageName);
        }, 10);
    };

    const fitImageByWith = (imageName) => {
        const image = mainView[imageName];
        zoomTo(image, 'width');

        setTimeout(() => {
            mainView.panToCanvasWidthCenter(imageName);
        }, 10);
    };

    useEffect(function afterMainViewCreated() {
        if (mainView) {
            zoomEvents();
            // initial zoom
            fitGreatestImageIfNeeded();

            setView('actual');

            if (mainView.diffImage) {
                setTimeout(() => {
                    setView('diff');
                }, 10);
            }

            // zoomTo(mainView[greatestImage.imageName], greatestImage.dimension);
            //
            // const anotherDimension = (greatestImage.dimension === 'height') ? 'width' : 'height';
            //
            // if (mainView[greatestImage.imageName][anotherDimension] > mainView.canvas[anotherDimension]) {
            //     zoomTo(mainView[greatestImage.imageName], anotherDimension);
            // }
            //
            // // initial pan
            // setTimeout(() => {
            //     mainView.panToCanvasWidthCenter(greatestImage.imageName);
            // }, 10);
        }
    }, [
        mainView?.toString(),
    ]);

    const [view, setView] = useState('actual');

    useEffect(() => {
        if (mainView) {
            mainView.switchView(view);
        }
    }, [view]);

    const viewSegmentData = [
        {
            label: (
                <Group position="left" spacing={4} noWrap>
                    <IconSquareLetterA stroke={1} size={18} />Actual
                </Group>
            ),
            value: 'actual',
        },
        {
            label: (
                <Group position="left" spacing={4} noWrap>
                    <IconSquareLetterE stroke={1} size={18} />
                    Expected
                </Group>
            ),
            value: 'expected',
        },
        {
            label:
                (
                    <Group position="left" spacing={4} noWrap>
                        <IconArrowsExchange2 stroke={1} size={18} />
                        Difference
                    </Group>
                ),
            value: 'diff',
            disabled: true,
        },
        {
            label:
                (
                    <Group position="left" spacing={4} noWrap>
                        <IconSquareHalf stroke={1} size={18} />
                        Slider
                    </Group>
                ),
            value: 'slider',
            disabled: true,
        },
    ];

    if (currentCheck?.diffId?.filename) {
        viewSegmentData[2].disabled = false;
        viewSegmentData[3].disabled = false;
    }

    return (
        <Group style={{ width: '96vw' }} spacing={4}>

            <Stack sx={{ width: '100%', }}>
                {/* Toolbar */}
                <Group position="apart">
                    <Group />
                    <Group spacing="sm">
                        <Group spacing={4} position="center" align="center">
                            <ActionIcon
                                title="Zoom in"
                                onClick={() => zoomByDelta(15)}
                            >
                                <IconZoomIn size={24} stroke={1} />
                            </ActionIcon>

                            <Popover width={130} position="bottom" withArrow shadow="md" opened={openedZoomPopover}>
                                <Popover.Target>
                                    <Group spacing={0} position="center" onClick={zoomPopoverHandler.toggle}>
                                        <Text
                                            size="lg"
                                            weight={400}
                                            sx={{ minWidth: '3em' }}
                                        >
                                            {Math.round(zoomPercent)}%
                                        </Text>
                                        <ActionIcon ml={-10}>
                                            <IconChevronDown />
                                        </ActionIcon>
                                    </Group>
                                </Popover.Target>
                                <Popover.Dropdown p={0}>
                                    <Stack spacing={0}>
                                        <Button
                                            variant="subtle"
                                            onClick={() => {
                                                zoomByPercent(50);
                                                if (view === 'slider') {
                                                    mainView.panToCanvasWidthCenter('actualImage');
                                                    return;
                                                }
                                                mainView.panToCanvasWidthCenter(`${view}Image`);
                                                zoomPopoverHandler.close();
                                            }}
                                        >
                                            50%
                                        </Button>
                                        <Button
                                            variant="subtle"
                                            onClick={() => {
                                                zoomByPercent(100);
                                                if (view === 'slider') {
                                                    mainView.panToCanvasWidthCenter('actualImage');
                                                    return;
                                                }
                                                mainView.panToCanvasWidthCenter(`${view}Image`);
                                                zoomPopoverHandler.close();
                                            }}
                                        >
                                            100%
                                        </Button>
                                        <Button
                                            variant="subtle"
                                            onClick={() => {
                                                zoomByPercent(200);
                                                if (view === 'slider') {
                                                    mainView.panToCanvasWidthCenter('actualImage');
                                                    return;
                                                }
                                                mainView.panToCanvasWidthCenter(`${view}Image`);
                                                zoomPopoverHandler.close();
                                            }}
                                        >
                                            200%
                                        </Button>
                                        <Button
                                            variant="subtle"
                                            onClick={() => {
                                                zoomPopoverHandler.close();
                                                if (view === 'slider') {
                                                    fitImageByWith('actualImage');
                                                    return;
                                                }
                                                fitImageByWith(`${view}Image`);
                                            }}
                                        >
                                            Fit by width
                                        </Button>
                                        <Button
                                            variant="subtle"
                                            onClick={() => {
                                                zoomPopoverHandler.close();

                                                if (view === 'slider') {
                                                    fitImageIfNeeded('actualImage');
                                                    return;
                                                }
                                                fitImageIfNeeded(`${view}Image`);
                                            }}
                                        >
                                            Fit co canvas
                                        </Button>
                                    </Stack>
                                </Popover.Dropdown>
                            </Popover>

                            <ActionIcon
                                title="Zoom out"
                                onClick={() => zoomByDelta(-15)}
                            >
                                <IconZoomOut size={24} stroke={1} />
                            </ActionIcon>
                        </Group>
                        <Divider orientation="vertical" />
                        <SegmentedControl
                            value={view}
                            onChange={setView}
                            data={viewSegmentData}
                        />
                        <Divider orientation="vertical" />
                        <ActionIcon
                            title="Add ignore region"
                            onClick={() => mainView.addIgnoreRegion({ name: 'ignore_rect', strokeWidth: 0 })}
                        >
                            <IconShape size={24} stroke={1} />
                        </ActionIcon>

                        <ActionIcon
                            onClick={() => MainView.sendIgnoreRegions(baselineId, mainView.getRectData())}
                        >
                            <IconDeviceFloppy size={24} stroke={1} />
                        </ActionIcon>
                        <Divider orientation="vertical" />
                        <AcceptButton
                            check={currentCheck}
                            checksQuery={checkQuery}
                            size={24}
                            testUpdateQuery={firstPageQuery}
                        />

                        <RemoveButton
                            check={currentCheck}
                            checksQuery={checkQuery}
                            size={30}
                            testUpdateQuery={firstPageQuery}
                            closeHandler={closeHandler}
                        />

                    </Group>

                </Group>

                {/* Main */}
                <Group
                    spacing={4}
                    align="start"
                    sx={{
                        width: '100%',
                    }}
                    noWrap
                >
                    {/* Related checks */}
                    <Group
                        align="start"
                        // style={
                        //     { width: '10%' }
                        // }
                        noWrap
                    >
                        <RelatedChecks
                            check={currentCheck}
                            related={related}
                        />
                    </Group>

                    {/* Canvas container */}
                    <Group
                        sx={
                            {
                                width: related.opened ? '92%' : '100%',
                            }
                        }
                    >
                        <Paper
                            shadow="xl"
                            withBorder
                            id="snapshoot"
                            style={
                                {
                                    backgroundColor: (
                                        theme.colorScheme === 'dark'
                                            ? theme.colors.dark[8]
                                            : theme.colors.gray[1]
                                    ),
                                    width: '100%',
                                    height: '100%',
                                    // width: `${vWidth - 220}px`,
                                    // height: `${vHeight - 150}px`,
                                }
                            }
                        >
                            <canvas style={{ width: '100%' }} id="2d" />
                        </Paper>
                    </Group>
                </Group>
            </Stack>
        </Group>
    );
}
