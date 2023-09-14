import { Button } from "@mantine/core";
import { Link, useLocation } from "@remix-run/react";

const NewPageButton = () => {
  const { pathname } = useLocation();

  return (
    <Button component={Link} to={`${pathname}/new`}>
      Add new ...
    </Button>
  );
};

export default NewPageButton;
