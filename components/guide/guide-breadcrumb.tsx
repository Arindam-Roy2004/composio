"use client";

import Link from "next/link";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/motion/breadcrumb";

export function GuideBreadcrumb({ appName }: { appName: string }) {
  return (
    <Breadcrumb>
      <BreadcrumbList maxItems={Infinity}>
        <BreadcrumbItem>
          <BreadcrumbLink render={(p) => <Link {...p} href="/" />}>OAuth Navigator</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink render={(p) => <Link {...p} href="/#library" />}>Guides</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{appName}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
