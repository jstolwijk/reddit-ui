import React, { FC, useEffect, useMemo, useRef, useState } from "react";
import useSWR, { useSWRInfinite } from "swr";
import { BrowserRouter as Router, Switch, Route, Link, useParams, Redirect } from "react-router-dom";
import { useLocalStorage } from "./use-local-storage";
import { timeAgo } from "./date";
const fetcher = (url: string) => fetch(url).then((response) => response.json());

const App = () => {
  return (
    <Router>
      <Switch>
        <Route path="/r/:subRedditName/comments/:commentsId">
          <Comments />
        </Route>
        <Route path="/r/:subRedditName">
          <SubReddit />
        </Route>
        <Route path="/r/">
          <SubReddit />
        </Route>
        <Route>
          <Redirect to="/r/" />
        </Route>
      </Switch>
    </Router>
  );
};

const Comments = () => {
  let { subRedditName, commentsId } = useParams<any>();

  const { data } = useSWR(`https://www.reddit.com/r/${subRedditName}/comments/${commentsId}.json`, fetcher);

  if (!data) {
    return <div>loading</div>;
  }

  const postData = data[0].data.children[0].data;
  return (
    <div>
      <h1>{postData.title}</h1>
      {postData.post_hint === "image" && <img src={postData.url} />}
      {}
    </div>
  );
};

const increment = (number: number | undefined) => (number ?? 0) + 1;

const getKey = (pageIndex: number, previousPageData: any, subRedditName: string | undefined) => {
  if (previousPageData && !previousPageData.data) return null;

  const base = subRedditName ? `https://www.reddit.com/r/${subRedditName}.json` : `https://www.reddit.com/.json`;
  if (pageIndex === 0) {
    return base;
  }
  return `${base}?after=${previousPageData.data.after}&before=${previousPageData.data.before}&limit=25`;
};

function SubReddit() {
  let { subRedditName } = useParams<any>();

  const [refreshData, setRefreshData] = useState(true);

  const [expandMedia, setExpandMedia] = useLocalStorage("expandMedia", true);

  const { data, setSize } = useSWRInfinite((pi, ppd) => getKey(pi, ppd, subRedditName), fetcher);

  console.log(data);

  const [value, setNewValue] = useLocalStorage("favorites", {});

  useEffect(() => {
    if (!subRedditName || subRedditName === "comments") {
      return;
    }
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
        <Toggle id="expand-media" label="Expand media" checked={expandMedia} onToggle={setExpandMedia} />
        <Toggle id="show-nsfw" label="NSFW" checked={refreshData} onToggle={setRefreshData} />

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
                  id={post.data.id}
                  expandMedia={expandMedia}
                  stickied={post.data.stickied}
                  key={post.data.permalink}
                  title={post.data.title}
                  postedBy={post.data.author}
                  media={post.data.media}
                  createdAt={post.data.created_utc}
                  mediaEmbed={post.data.media_embed}
                  type={post.data.post_hint}
                  url={post.data.url}
                  subReddit={post.data.subreddit}
                />
              </>
            ))}
        </div>
        <div className="p-32" ref={loader} onClick={() => setSize((page) => page + 1)}>
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

// TODO:
// * support cross post
// * Diaply links
// * Render open Graph thumb
interface PostProps {
  id: string;
  createdAt: number;
  stickied: boolean;
  title: string;
  postedBy: string;
  media: any;
  mediaEmbed: any;
  expandMedia: boolean;
  type?: string;
  url?: string;
  subReddit: string;
}

const regex = new RegExp("(.*)https://www.youtube.com/embed/([a-zA-Z0-9]+)(.*)");

const htmlDecode = (input: string): string | null => {
  const e = document.createElement("div");
  e.innerHTML = input;
  return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
};

const Post: FC<PostProps> = ({
  id,
  title,
  postedBy,
  media,
  mediaEmbed,
  createdAt,
  stickied,
  expandMedia,
  type,
  url,
  subReddit,
}) => {
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

  const bgColor = stickied ? "bg-yellow-100" : "bg-white";

  return (
    <Link to={"/r/" + subReddit + "/comments/" + id}>
      <div className={`p-2 m-4 rounded ${bgColor} shadow-lg divide-y font-extralight cursor-pointer`}>
        <div className="p-1">
          <h2 className="text-xl font-semibold">{title}</h2>
          <h3>{postType}</h3>
          {/* Add lazy loading to iframe: loading="lazy" https://web.dev/iframe-lazy-loading/ */}
          {expandMedia && mediaEmbed.content && (
            <div dangerouslySetInnerHTML={{ __html: htmlDecode(mediaEmbed.content) ?? "" }} />
          )}
          {expandMedia && type === "image" && <img src={url} />}
        </div>
        <div className="p-1 flex justify-between">
          <div>
            Posted by {postedBy} in <Link to={"/r/" + subReddit}>/r/{subReddit}</Link>
          </div>
          <div>{createdAtFormattedString}</div>
        </div>
      </div>
    </Link>
  );
};

export default App;
