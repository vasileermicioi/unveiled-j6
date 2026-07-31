import { Button, Dropdown, Label, Paragraph, Surface } from "@heroui/react";
import { ChevronDown } from "lucide-react";

import { signOut } from "../lib/auth-client";
import { useClientMounted } from "./useClientMounted";

type AccountMenuProps = {
  triggerLabel: string;
  email: string;
  creditsLabel?: string;
  profileHref?: string;
  profileLabel?: string;
  profileIsActive?: boolean;
  adminHref?: string;
  adminLabel?: string;
  logoutLabel: string;
};

const triggerClassName = "button button--secondary button--md site-account-menu__trigger";

export default function AccountMenu({
  triggerLabel,
  email,
  creditsLabel,
  profileHref,
  profileLabel,
  profileIsActive = false,
  adminHref,
  adminLabel,
  logoutLabel,
}: AccountMenuProps) {
  const mounted = useClientMounted();

  if (!mounted) {
    return (
      <Button
        aria-expanded={false}
        aria-haspopup="menu"
        className={triggerClassName}
        isDisabled
        type="button"
      >
        {triggerLabel}
        <ChevronDown
          aria-hidden
          className="site-account-menu__chevron"
          size={16}
          strokeWidth={2.25}
        />
      </Button>
    );
  }

  return (
    <Dropdown>
      <Button
        aria-current={profileIsActive ? "page" : undefined}
        aria-label={triggerLabel}
        className={triggerClassName}
      >
        {triggerLabel}
        <ChevronDown
          aria-hidden
          className="site-account-menu__chevron"
          size={16}
          strokeWidth={2.25}
        />
      </Button>
      <Dropdown.Popover className="site-account-menu__popover" placement="bottom end">
        <Surface className="site-account-menu__identity" variant="transparent">
          <Paragraph className="site-account-menu__email" color="muted" size="xs">
            {email}
          </Paragraph>
          {creditsLabel ? (
            <Paragraph className="site-account-menu__credits" color="muted" size="xs">
              {creditsLabel}
            </Paragraph>
          ) : null}
        </Surface>
        <Dropdown.Menu
          aria-label={triggerLabel}
          className="site-account-menu__menu"
          onAction={(key) => {
            if (key === "logout") {
              void signOut();
            }
          }}
        >
          {profileHref && profileLabel ? (
            <Dropdown.Item href={profileHref} id="profile" textValue={profileLabel}>
              <Label>{profileLabel}</Label>
            </Dropdown.Item>
          ) : null}
          {adminHref && adminLabel ? (
            <Dropdown.Item href={adminHref} id="admin" textValue={adminLabel}>
              <Label>{adminLabel}</Label>
            </Dropdown.Item>
          ) : null}
          <Dropdown.Item id="logout" textValue={logoutLabel}>
            <Label>{logoutLabel}</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
