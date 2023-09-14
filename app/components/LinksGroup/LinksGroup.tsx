/* eslint-disable jsx-a11y/anchor-has-content */
import type { ReactNode } from "react";

import { createStyles, NavLink } from "@mantine/core";
import { useLocation } from "@remix-run/react";
import { Link } from "@remix-run/react";

const useStyles = createStyles((theme) => ({
  link: {
    fontWeight: 500,
    padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
    fontSize: theme.fontSizes.lg,
    color: theme.colors.gray[7],

    "&:hover": {
      backgroundColor: theme.colors.gray[0],
      color: theme.black,
    },
  },
}));

interface LinksGroupProps {
  label: string;
  path: string;
  links?: { label: string; path: string }[];
}

const LinksGroup = ({ label, path, links }: LinksGroupProps) => {
  const { classes } = useStyles();
  const { pathname } = useLocation();

  const hasLinks = Array.isArray(links);
  const activeStatus = (path: string) => {
    return pathname === path ? true : false;
  };

  const items: Array<ReactNode> = (hasLinks ? links : []).map((link) => (
    <NavLink
      component={Link}
      className={classes.link}
      label={link.label}
      key={link.path}
      active={activeStatus(link.path)}
      to={link.path}
    />
  ));

  return (
    <NavLink
      component={Link}
      label={label}
      className={classes.link}
      active={activeStatus(path)}
      childrenOffset={32}
      to={hasLinks ? "" : path}
      children={items.length === 0 ? null : items}
    />
  );
};

export default LinksGroup;
