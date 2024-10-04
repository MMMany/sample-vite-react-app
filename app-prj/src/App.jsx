import { useState, useCallback, useMemo } from "react";

// mui
import {
  Box,
  Typography,
  Link,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
} from "@mui/material";

// emotion
import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";

import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";

import { terminal } from "virtual:terminal";

const getLogoSx = (isReact) => {
  const logoSpin = keyframes`
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  `;

  return {
    height: "6em",
    p: "1.5em",
    willChange: "filter",
    transition: "filter 300ms",
    "&:hover": {
      filter: isReact ? "drop-shadow(0 0 2em #61dafbaa)" : "drop-shadow(0 0 2em #646cffaa)",
    },
    animation: isReact ? `${logoSpin} infinite 20s linear` : null,
  };
};

const CountButton = styled(Button)({
  borderRadius: "8px",
  border: "1px solid transparent",
  padding: "0.6em 1.2em",
  marginBottom: "0.6em",
  fontSize: "1em",
  fontWeight: "500",
  fontFamily: "inherit",
  color: "white",
  backgroundColor: "#1a1a1a",
  cursor: "pointer",
  transition: "border-color 0.25s",
  "&:hover": {
    borderColor: "#646cff",
  },
  "&:focus, &:focus-visible": {
    outline: "4px auto -webkit-focus-ring-color",
  },
});

function App() {
  const [count, setCount] = useState(0);

  const statusUnique = useMemo(() => ["PASS", "FAIL", "SKIP", "Not Tested", "RUNNING"], []);
  const [selectItems, setSelectItems] = useState(["ALL"].concat(statusUnique));
  const [filteredItems, setFilteredItems] = useState(statusUnique);

  return (
    <>
      <Box>
        <Link href="https://vitejs.dev" target="_blank">
          <Box component="img" src={viteLogo} className="logo" alt="Vite logo" sx={getLogoSx(false)} />
        </Link>
        <Link href="https://react.dev" target="_blank">
          <Box component="img" src={reactLogo} className="logo react" alt="React logo" sx={getLogoSx(true)} />
        </Link>
      </Box>
      <Typography variant="h1">Vite + React</Typography>

      <Typography>Selected : {filteredItems.join(", ")}</Typography>
      <FormControl fullWidth>
        <InputLabel id="sample-select-label">Sample</InputLabel>
        <Select
          labelId="sample-select-label"
          id="sample-select"
          value={selectItems}
          label="Sample"
          multiple
          renderValue={useCallback(
            (selected) => {
              return selected.length > statusUnique.length ? "ALL" : selected.filter((it) => it !== "ALL").join(", ");
            },
            [statusUnique]
          )}
          onChange={useCallback(
            (event) => {
              const newValue = event.target.value;
              terminal.log(`${newValue.length} | ${selectItems.length} | ${statusUnique.length}`);

              if (newValue.length > selectItems.length) {
                const diff = newValue.filter((it) => !selectItems.includes(it))[0];
                if (!diff) throw new Error("invalid operation");
                terminal.log(`select: ${diff}`);
                if (diff === "ALL" || newValue.filter((it) => it !== "ALL").length === statusUnique.length) {
                  // all select case when empty selectItems
                  terminal.log("select all");
                  setSelectItems(["ALL"].concat(statusUnique));
                  setFilteredItems(statusUnique);
                } else {
                  if (newValue.length === 1) {
                    // not include "ALL" case
                    terminal.log("add 'ALL'");
                    setSelectItems(["ALL"].concat(newValue));
                    setFilteredItems(newValue);
                  } else {
                    // select
                    terminal.log("normal");
                    setSelectItems(newValue);
                    setFilteredItems(newValue.filter((it) => it !== "ALL"));
                  }
                }
              } else {
                const diff = selectItems.filter((it) => !newValue.includes(it))[0];
                if (!diff) throw new Error("invalid operation");
                terminal.log(`unselect: ${diff}`);
                if (diff === "ALL") {
                  if (newValue.length === statusUnique.length) {
                    // unselect all
                    terminal.log("unselect all");
                    setSelectItems([]);
                    setFilteredItems([]);
                  } else if (newValue.length > 0) {
                    // select all
                    terminal.log("select all");
                    setSelectItems(["ALL"].concat(statusUnique));
                    setFilteredItems(statusUnique);
                  } else {
                    // empty newValue
                    terminal.log("clear values");
                    setSelectItems([]);
                    setFilteredItems([]);
                  }
                } else {
                  if (newValue.length === 1) {
                    // remain only "ALL"
                    terminal.log("clear");
                    setSelectItems([]);
                    setFilteredItems([]);
                  } else {
                    // unselect
                    terminal.log("normal");
                    setSelectItems(newValue);
                    setFilteredItems(newValue.filter((it) => it !== "ALL"));
                  }
                }
              }
            },
            [selectItems, statusUnique]
          )}
        >
          {["ALL"].concat(statusUnique.sort()).map((it) => {
            return (
              <MenuItem key={`sample-item-${it}`} value={it}>
                {(() => {
                  const allChecked = selectItems.length - 1 === statusUnique.length;
                  const checked = selectItems.includes(it);
                  return (
                    <Checkbox
                      size="small"
                      indeterminate={it === "ALL" && selectItems.length > 0 ? !allChecked : null}
                      checked={checked}
                    />
                  );
                })()}
                <ListItemText size="small" primary={it} />
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

      <Box sx={{ p: "2em" }}>
        <CountButton onClick={() => setCount((prev) => prev + 1)}>count is {count}</CountButton>
        <Typography>Edit {<code>src/App.jsx</code>} and save to test HMR</Typography>
      </Box>
      <Typography sx={{ color: "#888" }}>Click on the Vite and React logos to learn more</Typography>
    </>
  );
}

export default App;
