import React, { FC, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { BrowserRouter as Router, Switch, Route, Link, useParams } from "react-router-dom";
import { useLocalStorage } from "./use-local-storage";

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

const increment = (number: number | undefined) => (number ?? 0) + 1;

function SubReddit() {
  let { subRedditName } = useParams<any>();

  const [refreshData, setRefreshData] = useState(true);
  const { data, error } = useSWR(`https://www.reddit.com/r/${subRedditName}.json`, fetcher, {
    refreshInterval: refreshData ? 10000 : undefined,
  });

  const [value, setNewValue] = useLocalStorage("favorites", { [subRedditName]: 1 });

  useEffect(() => {
    setNewValue({ ...value, [subRedditName]: increment(value[subRedditName]) });
  }, [subRedditName]);

  const favorites: string[] = useMemo(
    () =>
      Object.keys(value)
        .map((k) => ({ key: k, value: value[k] as number }))
        .sort((a, b) => (a.value > b.value ? -1 : 1))
        .map((e) => e.key)
        .slice(0, 10),
    []
  );
  return (
    <div>
      <Toggle id="live-feed" label="Live feed" checked={refreshData} onToggle={setRefreshData} />
      <div>
        Your favorite subreddits:
        <ul>
          {favorites.map((favorite) => (
            <li>
              <Link to={"/r/" + favorite} className="text-blue-600">
                {favorite}
              </Link>
            </li>
          ))}
        </ul>
      </div>
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
