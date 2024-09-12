// import type { NextApiRequest, NextApiResponse } from 'next'

// type ResponseData = {
//   message: string
// }

// export async function GET(
//   req: NextApiRequest,
//   res: NextApiResponse<ResponseData>
// ) {
//   res.status(200).json({ message: 'Hello from Next.js!' })
// }
"use client";

import React from "react";
import { useEffect, useState } from "react";

function MyPage() {
  const [queryParam, setQueryParam] = useState("");

  return (
    <div>
      <h1>&quot; I am not a professional manager &quot;</h1>
      <ul>
        <li>business paid community</li>
        <li>job descriptions</li>
      </ul>
      <h2>Slides</h2>
      <ul>
        <li>big vision</li>
        <li>Brands logos</li>
        <li>demo</li>
      </ul>
      <textarea defaultValue={"i LOVE U " + queryParam} />
    </div>
  );
}

export default MyPage;
