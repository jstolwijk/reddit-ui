import React, { FC, useEffect, useMemo, useRef, useState } from "react";
import useSWR, { useSWRInfinite } from "swr";
import { BrowserRouter as Router, Switch, Route, Link, useParams } from "react-router-dom";
import { useLocalStorage } from "./use-local-storage";
import { timeAgo } from "./date";
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

const getKey = (pageIndex: number, previousPageData: any, subRedditName: string) => {
  if (previousPageData && !previousPageData.data) return null;
  if (pageIndex === 0) {
    return `https://www.reddit.com/r/${subRedditName}.json`;
  }
  return `https://www.reddit.com/r/${subRedditName}.json?after=${previousPageData.data.after}&before=${previousPageData.data.before}&limit=25`;
};

function SubReddit() {
  let { subRedditName } = useParams<any>();

  const [refreshData, setRefreshData] = useState(true);

  const { data, setSize } = useSWRInfinite((pi, ppd) => getKey(pi, ppd, subRedditName), fetcher);

  console.log(data);

  const [value, setNewValue] = useLocalStorage("favorites", { [subRedditName]: 1 });

  useEffect(() => {
    setNewValue({ ...value, [subRedditName]: increment(value[subRedditName]) });
  }, [subRedditName]);

  const loader = useRef(null);

  const handleObserver = (entities: any) => {
    const target = entities[0];
    if (target.isIntersecting) {
      setSize((page) => page + 1);
    }
  };

  useEffect(() => {
    var options = {
      root: null,
      rootMargin: "500px",
      threshold: 0.1,
    };
    // initialize IntersectionObserver
    // and attaching to Load More div
    const observer = new IntersectionObserver(handleObserver, options);
    if (loader.current) {
      observer.observe(loader.current!);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

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
    <div className="bg-gray-100">
      <div className="container mx-auto">
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
          {data
            ?.flatMap((d) => d?.data?.children)
            ?.map((post: any) => (
              <>
                <Post
                  key={post.data.permalink}
                  title={post.data.title}
                  postedBy={post.data.author}
                  media={post.data.media}
                  createdAt={post.data.created_utc}
                />
              </>
            ))}
        </div>
        <div className="p-32" ref={loader}>
          <h2>Load More</h2>
        </div>
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
  createdAt: number;
  title: string;
  postedBy: string;
  media: any;
}

const regex = new RegExp("(.*)https://www.youtube.com/embed/([a-zA-Z0-9]+)(.*)");

const Post: FC<PostProps> = ({ title, postedBy, media, createdAt }) => {
  const matches = regex.exec(media?.oembed?.html);

  let postType = "";
  if (matches && matches[2]) {
    postType = "YouTube video";
  }

  const createdAtFormattedString = useMemo(() => {
    const d = new Date(0);
    d.setUTCSeconds(createdAt);
    return timeAgo(d);
  }, [createdAt]);

  return (
    <div className="p-2 m-4 rounded bg-white shadow-lg divide-y font-extralight cursor-pointer">
      <div className="p-1">
        <h2 className="text-xl font-semibold">{title}</h2>
        <h3>{postType}</h3>
        {media?.type === "youtube.com" && media?.oembed && matches && (
          <div>
            <iframe
              className="youtube-frame"
              src={`https://www.youtube.com/embed/${matches[2]}?autoplay=0`}
              allowFullScreen
            />
          </div>
        )}
      </div>
      <div className="p-1 flex justify-between">
        <div>Posted by {postedBy}</div>
        <div>{createdAtFormattedString}</div>
      </div>
    </div>
  );
};

export default App;
