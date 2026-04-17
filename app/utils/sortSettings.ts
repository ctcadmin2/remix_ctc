import type { Setting } from "@db/client";
//TODO improve sorting
const sortSettings = (a: Setting, b: Setting) => {
  return a.id - b.id;
};

export default sortSettings;
