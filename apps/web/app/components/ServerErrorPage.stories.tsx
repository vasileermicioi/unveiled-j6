import type { Story } from "@ladle/react";

import { ServerErrorPage } from "./ServerErrorPage";

export const German: Story = () => <ServerErrorPage locale="de" />;
German.storyName = "ServerErrorPage / German";

export const English: Story = () => <ServerErrorPage locale="en" />;
English.storyName = "ServerErrorPage / English";
