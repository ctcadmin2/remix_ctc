import { createTheme, type MantineThemeOverride } from "@mantine/core";

export const theme: MantineThemeOverride = createTheme({
  components: {
    InputWrapper: {
      styles: () => ({
        root: {
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
          flexWrap: "wrap-reverse",
          paddingBottom: "1rem",
        },
        label: {
          width: "5rem",
          marginRight: "1rem",
        },
        error: {
          width: "100%",
          paddingBottom: "0.5rem",
        },
      }),
    },
    Input: {
      styles: () => ({
        wrapper: {
          flexGrow: 1,
        },
      }),
    },
    Select: {
      styles: () => ({
        root: {
          div: {
            flexGrow: 1,
          },
        },
      }),
    },
    MultiSelect: {
      styles: () => ({
        root: {
          div: {
            flexGrow: 1,
          },
        },
      }),
    },
    Switch: {
      styles: () => ({
        labelWrapper: {
          width: "5rem",
        },
      }),
    },
    Tabs: {
      styles: () => ({
        tabsList: {
          marginBottom: "0.5rem",
        },
        panel: {
          paddingRight: "10px",
        },
      }),
    },
  },
});
