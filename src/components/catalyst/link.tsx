import * as Headless from "@headlessui/react";
import {
  Link as RouterLink,
  type LinkProps as RouterLinkProps,
} from "@tanstack/react-router";
import React, { forwardRef } from "react";

function shouldUseRouterLink({
  href,
  target,
  download,
}: {
  href: string;
  target: React.HTMLAttributeAnchorTarget | undefined;
  download: unknown;
}): boolean {
  return href.startsWith("/") && !href.startsWith("//") && !target && !download;
}

export const Link = forwardRef(function Link(
  {
    href,
    target,
    download,
    ...props
  }: { href: string } & React.ComponentPropsWithoutRef<"a">,
  ref: React.ForwardedRef<HTMLAnchorElement>,
) {
  return (
    <Headless.DataInteractive>
      {shouldUseRouterLink({
        href,
        target,
        download,
      }) ? (
        <RouterLink
          {...props}
          to={href as Exclude<RouterLinkProps["to"], undefined>}
          ref={ref}
        />
      ) : (
        <a
          href={href}
          {...(target === undefined ? {} : { target })}
          {...(download === undefined ? {} : { download })}
          {...props}
          ref={ref}
        />
      )}
    </Headless.DataInteractive>
  );
});
