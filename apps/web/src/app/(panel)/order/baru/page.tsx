"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewOrderRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/order?baru=1");
  }, [router]);

  return null;
}
