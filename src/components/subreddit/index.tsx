import { FC, useCallback, useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router";
import { Link } from "react-router-dom";
import { useSWRInfinite } from "swr";
import { timeAgo } from "../../date";
import { useLocalStorage } from "../../use-local-storage";
import { Block, Stack } from "../Components";
import { useQueryParam } from "../use-query-params";

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

export const fetcher = async (url: string) => {
  const response = await fetch(url);

  if (response.ok) {
    return await response.json();
  } else {
    const error = new Error("An error occurred while fetching the data.") as any;
    error.info = await response.json();
    error.status = response.status;
    throw error;
  }
};
export default function SubReddit() {
  let { subRedditName } = useParams<any>();
  const [expandMedia, _] = useLocalStorage("expandMedia", true);

  const [timeRange, setTimeRange] = useQueryParam("t", TimeRange.TODAY);
  const [viewType, setViewType] = useQueryParam("viewType", ViewType.HOT);

  const { data, setSize, error } = useSWRInfinite(
    (pi, ppd) => getKey(pi, ppd, subRedditName, viewType, timeRange),
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateAll: false,
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        if (error.status === 404) return;

        setTimeout(() => revalidate({ retryCount }), 5000);
      },
    }
  );

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

  return (
    <div className="col-span-10">
      <Stack>
        <Block>
          <div className="px-2">
            <h1 className="capitalize text-3xl font-bold text-gray-900 tracking-tight">
              {subRedditName || "Frontpage"}
            </h1>
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
        {error && <SubredditError statusCode={error.status} />}
        {!error && !data && <LoadingPosts />}
        {!error &&
          data
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
                  domain={post.data.domain}
                />
              </>
            ))}
      </Stack>
      {!error && (
        <div className="p-32" ref={loader} onClick={() => setSize((page) => page + 1)}>
          <h2>Load More</h2>
        </div>
      )}
    </div>
  );
}

const LoadingPosts = () => {
  return (
    <>
      <Block>
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-8 bg-gray-300 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </Block>
      <Block>
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-8 bg-gray-300 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </Block>
      <Block>
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-8 bg-gray-300 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </Block>
      <Block>
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-8 bg-gray-300 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded w-5/6"></div>
              <div className="h-4 bg-gray-300 rounded w-3/6"></div>
            </div>
          </div>
        </div>
      </Block>
      <Block>
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-8 bg-gray-300 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </Block>
      <Block>
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-8 bg-gray-300 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </Block>
      <Block>
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-8 bg-gray-300 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </Block>
      <Block>
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-8 bg-gray-300 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </Block>
      <Block>
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-8 bg-gray-300 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </Block>
      <Block>
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-8 bg-gray-300 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </Block>
      <Block>
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-8 bg-gray-300 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </Block>
    </>
  );
};
interface SubredditErrorProps {
  statusCode: number;
}
const SubredditError: FC<SubredditErrorProps> = ({ statusCode }) => {
  return (
    <div>
      <p>{statusCode === 404 ? "Subreddit not found" : "Unknown error occured"}</p>
    </div>
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
  domain: string;
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
  domain,
}) => {
  const createdAtFormattedString = useMemo(() => {
    const d = new Date(0);
    d.setUTCSeconds(createdAt);
    return timeAgo(d);
  }, [createdAt]);

  const externalUrl =
    domain.startsWith("self.") || domain.endsWith("redd.it")
      ? undefined
      : url && url.startsWith("https://www.reddit.com")
      ? url.replace("https://www.reddit.com", "")
      : url;

  return (
    <Block backGroundColor={stickied ? "bg-yellow-100" : undefined}>
      <div className="p-1 overflow-hidden">
        <TitleLink externalUrl={externalUrl} internalUrl={"/r/" + subReddit + "/comments/" + id}>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">{title}</h2>
        </TitleLink>
        {/* Add lazy loading to iframe: loading="lazy" https://web.dev/iframe-lazy-loading/ */}

        {expandMedia && mediaEmbed.content && (
          <div className="mx-auto" dangerouslySetInnerHTML={{ __html: htmlDecode(mediaEmbed.content) ?? "" }} />
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
