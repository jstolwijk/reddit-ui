import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { Link } from "react-router-dom";
import { useSWRInfinite } from "swr";
import { timeAgo } from "../../date";
import { useLocalStorage } from "../../use-local-storage";
import { Block, ScreenSize, Stack, useScreenSize } from "../Components";
import { useQueryParam } from "../use-query-params";

const increment = (number: number | undefined) => (number ?? 0) + 1;

enum ViewType {
  TOP = "top",
  NEW = "new",
  HOT = "hot",
}

enum TimeRange {
  NOW = "hour",
  TODAY = "day",
  THIS_WEEK = "week",
  THIS_MONTH = "month",
  THIS_YEAR = "year",
  ALL_TIME = "all",
}

const getKey = (
  pageIndex: number,
  previousPageData: any,
  subRedditName: string | undefined,
  viewType: ViewType,
  timeRange: TimeRange
) => {
  if (previousPageData && !previousPageData.data) return null;

  const base = subRedditName
    ? `https://www.reddit.com/r/${subRedditName}/${viewType.toLowerCase()}/.json`
    : `https://www.reddit.com/${viewType.toLowerCase()}/.json`;

  const timePart = viewType === ViewType.TOP ? `t=${timeRange.toLowerCase()}` : "";

  if (pageIndex === 0) {
    return base + (timePart ? "?" + timePart : "");
  }

  return `${base}?after=${previousPageData.data.after}&before=${previousPageData.data.before}&limit=25${
    timePart ? "&" + timePart : ""
  }`;
};

interface ViewTypeSelectorProps {
  viewType: ViewType;
  onViewTypeChange: (viewType: ViewType) => void;
}

const ViewTypeSelector: FC<ViewTypeSelectorProps> = ({ viewType, onViewTypeChange }) => {
  return (
    <div className="relative inline-flex">
      <svg
        className="w-2 h-2 absolute top-0 right-0 m-4 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 412 232"
      >
        <path
          d="M206 171.144L42.678 7.822c-9.763-9.763-25.592-9.763-35.355 0-9.763 9.764-9.763 25.592 0 35.355l181 181c4.88 4.882 11.279 7.323 17.677 7.323s12.796-2.441 17.678-7.322l181-181c9.763-9.764 9.763-25.592 0-35.355-9.763-9.763-25.592-9.763-35.355 0L206 171.144z"
          fill="#648299"
          fill-rule="nonzero"
        />
      </svg>

      <select
        value={viewType}
        onChange={(e) => onViewTypeChange(e.target.value as ViewType)}
        className="border border-gray-300 rounded-full text-gray-600 h-10 pl-5 pr-10 bg-white hover:border-gray-400 focus:outline-none appearance-none"
      >
        <option value={ViewType.HOT}>Hot</option>
        <option value={ViewType.NEW}>New</option>
        <option value={ViewType.TOP}>Top</option>
      </select>
    </div>
  );
};

interface TimeRangeSelectorProps {
  timeRange: TimeRange;
  onTimeRangeChanged: (timeRange: TimeRange) => void;
}

const TimeRangeSelector: FC<TimeRangeSelectorProps> = ({ timeRange, onTimeRangeChanged }) => {
  return (
    <div className="relative inline-flex">
      <svg
        className="w-2 h-2 absolute top-0 right-0 m-4 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 412 232"
      >
        <path
          d="M206 171.144L42.678 7.822c-9.763-9.763-25.592-9.763-35.355 0-9.763 9.764-9.763 25.592 0 35.355l181 181c4.88 4.882 11.279 7.323 17.677 7.323s12.796-2.441 17.678-7.322l181-181c9.763-9.764 9.763-25.592 0-35.355-9.763-9.763-25.592-9.763-35.355 0L206 171.144z"
          fill="#648299"
          fill-rule="nonzero"
        />
      </svg>

      <select
        value={timeRange}
        onChange={(e) => onTimeRangeChanged(e.target.value as TimeRange)}
        className="border border-gray-300 rounded-full text-gray-600 h-10 pl-5 pr-10 bg-white hover:border-gray-400 focus:outline-none appearance-none"
      >
        <option value={TimeRange.NOW}>Now</option>
        <option value={TimeRange.TODAY}>Today</option>
        <option value={TimeRange.THIS_WEEK}>This week</option>
        <option value={TimeRange.THIS_MONTH}>This month</option>
        <option value={TimeRange.THIS_YEAR}>This year</option>
        <option value={TimeRange.ALL_TIME}>All time</option>
      </select>
    </div>
  );
};

const fetcher = (url: string) => fetch(url).then((response) => response.json());

export default function SubReddit() {
  let { subRedditName } = useParams<any>();

  const [refreshData, setRefreshData] = useState(true);

  const [expandMedia, setExpandMedia] = useLocalStorage("expandMedia", true);

  const [timeRange, setTimeRange] = useQueryParam("t", TimeRange.TODAY);
  const [viewType, setViewType] = useQueryParam("viewType", ViewType.HOT);

  const { data, setSize } = useSWRInfinite((pi, ppd) => getKey(pi, ppd, subRedditName, viewType, timeRange), fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateAll: false,
  });

  const [value, setNewValue] = useLocalStorage("favorites", {});

  useEffect(() => {
    if (!subRedditName || subRedditName === "comments") {
      return;
    }
    setNewValue({ ...value, [subRedditName]: increment(value[subRedditName]) });

    // eslint tells us to add setNewValue and value to the depenendency list, if we do this the component will get stuck in a rerender loop since value is a complex object
    // eslint-disable-next-line
  }, [subRedditName]);

  const loader = useRef(null);

  const handleObserver = useCallback(
    (entities: any) => {
      const target = entities[0];
      if (target.isIntersecting) {
        setSize((page) => page + 1);
      }
    },
    [setSize]
  );

  useEffect(() => {
    let observer: IntersectionObserver;

    // Wait a bit before adding the infinite scroll detection
    const timeout = setTimeout(() => {
      const options = {
        root: null,
        rootMargin: "500px",
        threshold: 0.1,
      };

      observer = new IntersectionObserver(handleObserver, options);
      if (loader.current) {
        observer.observe(loader.current!);
      }
    }, 1500);

    return () => {
      clearTimeout(timeout);
      observer?.disconnect();
    };
  }, [handleObserver]);

  const favorites: string[] = useMemo(
    () =>
      Object.keys(value)
        .map((k) => ({ key: k, value: value[k] as number }))
        .sort((a, b) => (a.value > b.value ? -1 : 1))
        .map((e) => e.key)
        .slice(0, 20),
    [value]
  );

  const screenSize = useScreenSize();

  return (
    <>
      <div className="bg-gray-100 md:px-2">
        <div className="container mx-auto">
          <div className="lg:grid lg:grid-flow-col lg:grid-cols-12 lg:space-x-2 space-y-1">
            <div className="col-span-10">
              <Stack>
                <Block>
                  <div className="px-2">
                    <h1 className="font-bold text-2xl">{subRedditName || "Front page"}</h1>
                    <div className="py-4 flex ">
                      <ViewTypeSelector viewType={viewType} onViewTypeChange={setViewType} />
                      {viewType === ViewType.TOP && (
                        <div className="pl-2">
                          <TimeRangeSelector timeRange={timeRange} onTimeRangeChanged={setTimeRange} />
                        </div>
                      )}
                    </div>
                  </div>
                </Block>
              </Stack>
              <Stack>
                {!data && <p>Pending</p>}
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
              </Stack>
              <div className="p-32" ref={loader} onClick={() => setSize((page) => page + 1)}>
                <h2>Load More</h2>
              </div>
            </div>
            {screenSize > ScreenSize.md && (
              <div className="col-span-2">
                <Settings
                  refreshData={refreshData}
                  expandMedia={expandMedia}
                  favorites={favorites}
                  setExpandMedia={setExpandMedia}
                  setRefreshData={setRefreshData}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

interface SettingsProps {
  refreshData: boolean;
  setRefreshData: (bool: boolean) => void;
  expandMedia: boolean;
  setExpandMedia: (bool: boolean) => void;
  favorites: any[];
}

const Settings: FC<SettingsProps> = ({ refreshData, setRefreshData, expandMedia, setExpandMedia, favorites }) => {
  return (
    <div className="sticky top-0">
      <Stack>
        <Block>
          <Link to="/">Frontpage</Link>
          <div className="flex flex-col">
            <Toggle id="live-feed" label="Live feed" checked={refreshData} onToggle={setRefreshData} />
            <Toggle id="expand-media" label="Expand media" checked={expandMedia} onToggle={setExpandMedia} />
            <Toggle id="show-nsfw" label="NSFW" checked={refreshData} onToggle={setRefreshData} />
          </div>
        </Block>
        <Block>
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
        </Block>
      </Stack>
    </div>
  );
};

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
  const createdAtFormattedString = useMemo(() => {
    const d = new Date(0);
    d.setUTCSeconds(createdAt);
    return timeAgo(d);
  }, [createdAt]);

  return (
    <Block backGroundColor={stickied ? "bg-yellow-100" : undefined}>
      <div className="p-1 overflow-hidden">
        <TitleLink externalUrl={url} internalUrl={"/r/" + subReddit + "/comments/" + id}>
          <h2 className="text-xl font-semibold">{title}</h2>
        </TitleLink>
        {/* Add lazy loading to iframe: loading="lazy" https://web.dev/iframe-lazy-loading/ */}

        {expandMedia && mediaEmbed.content && (
          <div dangerouslySetInnerHTML={{ __html: htmlDecode(mediaEmbed.content) ?? "" }} />
        )}
        {expandMedia && type === "image" && (
          <div className="p-2">
            <img className="object-scale-down max-h-96 w-full" src={url} alt="Media" />
          </div>
        )}
      </div>
      <div className="p-1 flex justify-between">
        <div>
          Posted by {postedBy} in <Link to={"/r/" + subReddit}>/r/{subReddit}</Link>
        </div>
        <div>
          <Link to={`/r/${subReddit}/comments/${id}`}>Comments</Link>
        </div>
        <div>{createdAtFormattedString}</div>
      </div>
    </Block>
  );
};

interface TitleLinkProps {
  internalUrl: string;
  externalUrl?: string;
}

const TitleLink: FC<TitleLinkProps> = ({ externalUrl, internalUrl, children }) => {
  if (externalUrl) {
    return (
      <a href={externalUrl} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }

  return <Link to={internalUrl}>{children}</Link>;
};
