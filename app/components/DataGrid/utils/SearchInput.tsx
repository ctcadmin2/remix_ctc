import { TextInput, ThemeIcon } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useSearchParams } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "react-feather";

const SearchInput = () => {
  //use to skip useEffect on first render
  //https://stackoverflow.com/questions/53179075/with-useeffect-how-can-i-skip-applying-an-effect-upon-the-initial-render
  const didMountRef = useRef(false);
  const queryRef = useRef<HTMLInputElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("filter") || "");
  const [debouncedQuery] = useDebouncedValue(query, 300);

  useEffect(() => {
    queryRef?.current?.focus();
  });

  useEffect(() => {
    if (didMountRef.current) {
      if (debouncedQuery.length === 0) {
        searchParams.delete("filter");
        setSearchParams(searchParams);
        return;
      }
      searchParams.set("filter", debouncedQuery);
      setSearchParams(searchParams);
    }
    didMountRef.current = true;
  }, [debouncedQuery, searchParams, setSearchParams]);

  return (
    <TextInput
      placeholder="Search..."
      ref={queryRef}
      leftSection={<Search size={"16px"} strokeWidth="3px" />}
      rightSection={
        query.length === 0 ? null : (
          <ThemeIcon variant="outline" radius="xl" size="sm" color="red">
            <X onClick={() => setQuery("")} />
          </ThemeIcon>
        )
      }
      radius="xl"
      value={query}
      onChange={(event) => setQuery(event.currentTarget.value)}
    />
  );
};

export default SearchInput;
