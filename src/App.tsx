import React, { FC, useState } from "react";
import useSWR from "swr";
import { BrowserRouter as Router, Switch, Route, Link, useParams } from "react-router-dom";

const fetcher = (url: string) => fetch(url).then((response) => response.json());

const App = () => {
  return (
    <Router>
      <Switch>
        <Route path="/r/:subRedditName">
          <SubReddit />
        </Route>
        <Route>
          <div>Default</div>
        </Route>
      </Switch>
    </Router>
  );
};

function SubReddit() {
  let { subRedditName } = useParams<any>();

  const [refreshData, setRefreshData] = useState(true);
  const { data, error } = useSWR(`https://www.reddit.com/r/${subRedditName}.json`, fetcher, {
    refreshInterval: refreshData ? 10000 : undefined,
  });
  console.log(data);
  return (
    <div>
      <Toggle id="live-feed" label="Live feed" checked={refreshData} onToggle={setRefreshData} />
      <div>
        {data?.data?.children?.map((post: any) => (
          <>
            <Post key={post.data.permalink} title={post.data.title} postedBy="jesse" />
          </>
        ))}
      </div>
    </div>
  );
}

interface ToggleProps {
  id: string;
  label: string;
  checked: boolean;
  onToggle: (newValue: boolean) => void;
}

const Toggle: FC<ToggleProps> = ({ id, label, checked, onToggle }) => {
  const toggleClasses = checked
    ? "absolute block w-4 h-4 mt-1 ml-1 rounded-full shadow inset-y-0 left-0 focus-within:shadow-outline transition-transform duration-300 ease-in-out bg-blue-400 transform translate-x-full"
    : "absolute block w-4 h-4 mt-1 ml-1 bg-white rounded-full shadow inset-y-0 left-0 focus-within:shadow-outline transition-transform duration-300 ease-in-out";

  return (
    <label htmlFor={id} className="mt-3 inline-flex items-center cursor-pointer">
      <span className="relative">
        <span className="block w-10 h-6 bg-gray-300 rounded-full shadow-inner"></span>
        <span className={toggleClasses}>
          <input id={id} type="checkbox" className="absolute opacity-0 w-0 h-0" onClick={() => onToggle(!checked)} />
        </span>
      </span>
      <span className="ml-3 text-sm">{label}</span>
    </label>
  );
};

interface PostProps {
  title: string;
  postedBy: string;
}

const Post: FC<PostProps> = ({ title, postedBy }) => {
  return (
    <div>
      <h2>{title}</h2>
      <p>{postedBy}</p>
    </div>
  );
};

export default App;
