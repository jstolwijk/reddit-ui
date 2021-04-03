import React from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((response) => response.json());

function App() {
  const { data, error } = useSWR("https://www.reddit.com/r/GlobalOffensive.json", fetcher);
  console.log(data);
  return (
    <div>
      <div>
        {data?.data?.children?.map((post: any) => (
          <div key={post.data.permalink}>
            <h3>{post.data.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
