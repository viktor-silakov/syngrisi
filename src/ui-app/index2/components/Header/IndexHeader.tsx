import {
    Breadcrumbs,
    Burger,
    Container,
    Group,
    Header,
    Kbd,
    Paper,
    Button,
    useMantineTheme,
    Text,
} from '@mantine/core';
import * as React from 'react';
import { useDisclosure } from '@mantine/hooks';
import { IconSearch } from '@tabler/icons';
import { createStyles } from '@mantine/styles';
import { useContext } from 'react';
import { openSpotlight } from '@mantine/spotlight';
import useColorScheme from '../../../shared/hooks/useColorSheme';
import ToggleThemeButton from '../../../shared/components/ToggleThemeButton';
import HeaderLogo from './HeaderLogo';
import { isDark } from '../../../shared/utils';
import UserMenu from './UserMenu';
import { AppContext } from '../../AppContext';

const useStyles = createStyles((theme) => ({
    header: {
        paddingLeft: theme.spacing.md,
        paddingRight: theme.spacing.md,
    },

    inner: {
        height: 56,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: isDark() ? theme.colors.dark[5] : theme.colors.gray[2],
    },

    links: {
        [theme.fn.smallerThan('md')]: {
            display: 'none',
        },
    },

    search: {
        [theme.fn.smallerThan('xs')]: {
            display: 'none',
        },
    },

    link: {
        display: 'block',
        lineHeight: 1,
        padding: '8px 12px',
        borderRadius: theme.radius.sm,
        textDecoration: 'none',
        color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.colors.gray[7],
        fontSize: theme.fontSizes.sm,
        fontWeight: 500,

        '&:hover': {
            backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
        },
    },
    subheader: {
        height: 42,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingLeft: 25,
    },
}));

const links = [
    { label: 'Tests Results', link: '/' },
    { label: 'Admin Panel', link: '/admin/' },
];

export default function IndexHeader() {
    const [colorScheme, toggleColorScheme] = useColorScheme();

    const [opened, { toggle }] = useDisclosure(false);
    const { classes } = useStyles();

    const items = links.map((link) => (
        <a
            key={link.label}
            href={link.link}
            className={classes.link}
        >
            {link.label}
        </a>
    ));

    const { toolbar, breadCrumbs }: any = useContext(AppContext);
    const theme = useMantineTheme();

    return (
        <Header
            height={100}
            className={classes.header}
            mb={120}
            pr={0}
            pl={0}
        >
            <Container className={classes.inner} fluid>
                <Group>
                    <Burger opened={opened} onClick={toggle} size="sm" />
                    <HeaderLogo />
                </Group>

                <Group>
                    <Group ml={50} spacing={5} className={classes.links}>
                        {items}
                    </Group>
                    <Button
                        onClick={() => openSpotlight()}
                        variant="default"
                        sx={{ minWidth: 200, display: 'flex' }}
                        pl={12}
                        pr={8}
                        styles={
                            {
                                root: {
                                    backgroundColor: theme.colorScheme === 'dark'
                                        ? theme.colors.dark[6]
                                        : theme.colors.gray[0],
                                    '&:hover': {
                                        backgroundColor: theme.colorScheme === 'dark'
                                            ? theme.colors.dark[6]
                                            : theme.colors.gray[0],
                                    },
                                },
                            }
                        }
                    >
                        <Group position="apart" sx={{ minWidth: 200 }}>
                            <Group>
                                <IconSearch size={16} stroke={1} />
                                <Text color="dimmed" weight={400}>Search</Text>
                            </Group>

                            <Kbd
                                sx={{ fontSize: 11, borderBottomWidth: 1 }}
                            >
                                ⌘ + K
                            </Kbd>
                        </Group>

                    </Button>

                    <Group spacing={7}>
                        <UserMenu />
                    </Group>

                    <Group>
                        <ToggleThemeButton colorScheme={colorScheme} toggleColorScheme={toggleColorScheme} />
                    </Group>
                </Group>
            </Container>
            <Paper shadow="">
                <Container className={classes.subheader} fluid>
                    <Group>
                        <Breadcrumbs>{breadCrumbs}</Breadcrumbs>
                    </Group>
                    <Group spacing={4} mr="md" position="right">
                        {toolbar}
                    </Group>
                </Container>
            </Paper>
        </Header>
    );
}
