"use client";

import React from "react";
import Script from "next/script";
import ARQuest from "./ARQuest";

export default function ARQuestSection(): JSX.Element {
  return (
    <>
      <Script src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}&libraries=geometry`} strategy="beforeInteractive" />
      <ARQuest />
    </>
  );
}


