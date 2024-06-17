import { NavLink } from "@mantine/core";
import { Link, useLocation } from "@remix-run/react";
import type { ReactNode } from "react";

import classes from "../../css/NavLink.module.css";

interface LinksGroupProps {
  label: string;
  path: string;
  links?: { label: string; path: string }[];
}

const LinksGroup = ({ label, path, links }: LinksGroupProps) => {
  const { pathname } = useLocation();

  const hasLinks = Array.isArray(links);
  const activeStatus = (path: string) => {
    return pathname === path;
  };

  const items: ReactNode[] = (hasLinks ? links : []).map((link) => (
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
    >
      {items.length === 0 ? null : items}
    </NavLink>
  );
};

export default LinksGroup;
