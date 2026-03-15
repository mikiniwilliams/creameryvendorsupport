import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import {
  PlusCircle, ArrowRightLeft, AlertTriangle, UserCheck, MessageSquare, Pencil,
} from "lucide-react";

interface Activity {
  id: string;
  ticket_id: string;
  user_id: string | null;
  activity_type: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

interface ProfileMap {
  [userId: string]: { full_name: string | null; email?: string | null };
}

// A7: Visual differentiation by activity type
const activityConfig: Record<string, { icon: React.ReactNode; label: string; iconColor: string; borderColor: string }> = {
  created: {
    icon: <PlusCircle className="h-4 w-4" />,
    label: "created this ticket",
    iconColor: "text-green-600 bg-green-100",
    borderColor: "#1D9E75",
  },
  status_change: {
    icon: <ArrowRightLeft className="h-4 w-4" />,
    label: "changed status",
    iconColor: "text-amber-600 bg-amber-100",
    borderColor: "#E8A020",
  },
  priority_change: {
    icon: <AlertTriangle className="h-4 w-4" />,
    label: "changed priority",
    iconColor: "text-blue-600 bg-blue-100",
    borderColor: "#378ADD",
  },
  assignment_change: {
    icon: <UserCheck className="h-4 w-4" />,
    label: "changed assignment",
    iconColor: "text-gray-500 bg-gray-100",
    borderColor: "#d4d4d4",
  },
  comment: {
    icon: <MessageSquare className="h-4 w-4" />,
    label: "commented",
    iconColor: "text-blue-600 bg-blue-100",
    borderColor: "#378ADD",
  },
  title_updated: {
    icon: <Pencil className="h-4 w-4" />,
    label: "updated the ticket title",
    iconColor: "text-gray-500 bg-gray-100",
    borderColor: "#d4d4d4",
  },
  description_updated: {
    icon: <Pencil className="h-4 w-4" />,
    label: "updated the ticket description",
    iconColor: "text-gray-500 bg-gray-100",
    borderColor: "#d4d4d4",
  },
};

const formatValue = (value: string | null) => {
  if (!value || value === "null") return "none";
  return value.replace(/_/g, " ");
};

const VENDOR_VISIBLE_TYPES = ["status_change", "comment"];

const ActivityTimeline = ({ ticketId, userRole }: { ticketId: string; userRole?: string | null }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [profiles, setProfiles] = useState<ProfileMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      const { data } = await supabase
        .from("ticket_activity")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (data) {
        setActivities(data as Activity[]);
        const userIds = [...new Set(data.map((a) => a.user_id).filter(Boolean))] as string[];
        if (userIds.length > 0) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("user_id, full_name, email")
            .in("user_id", userIds);
          if (profileData) {
            const map: ProfileMap = {};
            profileData.forEach((p) => { map[p.user_id] = p; });
            setProfiles(map);
          }
        }
      }
      setLoading(false);
    };
    fetchActivities();
  }, [ticketId]);

  const getUserName = (userId: string | null) => {
    if (!userId) return "System";
    const p = profiles[userId];
    return p?.full_name || p?.email?.split("@")[0] || "Team Member";
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (activities.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">No activity yet.</p>;
  }

  return (
    <div className="relative space-y-0">
      <div className="absolute left-[17px] top-2 bottom-2 w-px bg-border" />

      {activities
        .filter((a) => userRole === "admin" || VENDOR_VISIBLE_TYPES.includes(a.activity_type))
        .map((activity, index, filtered) => {
        const config = activityConfig[activity.activity_type] || activityConfig.comment;
        const isLast = index === filtered.length - 1;
        const isAssignment = activity.activity_type === "assignment_change";

        return (
          <div key={activity.id} className={`relative flex gap-4 ${isLast ? "" : "pb-5"}`}
            style={{ borderLeft: `3px solid ${config.borderColor}`, marginLeft: -1, paddingLeft: 12 }}>
            {/* Icon */}
            <div className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${config.iconColor}`}>
              {config.icon}
            </div>

            {/* Content */}
            <div className={`min-w-0 flex-1 pt-1 ${isAssignment ? "text-[85%] text-muted-foreground" : ""}`}>
              <div className="flex flex-wrap items-baseline gap-1">
                <span className={`font-medium ${isAssignment ? "text-xs" : "text-sm"}`}>{getUserName(activity.user_id)}</span>
                <span className={`text-muted-foreground ${isAssignment ? "text-xs" : "text-sm"}`}>{config.label}</span>
              </div>

              {activity.activity_type === "status_change" && (
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="line-through">{formatValue(activity.old_value)}</span>
                  {" → "}
                  <span className="font-medium text-foreground">{formatValue(activity.new_value)}</span>
                </p>
              )}
              {activity.activity_type === "priority_change" && (
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="line-through">{formatValue(activity.old_value)}</span>
                  {" → "}
                  <span className="font-medium text-foreground">{formatValue(activity.new_value)}</span>
                </p>
              )}
              {activity.activity_type === "assignment_change" && (
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="line-through">{getUserName(activity.old_value)}</span>
                  {" → "}
                  <span className="font-medium text-foreground">
                    {activity.new_value && activity.new_value !== "null"
                      ? getUserName(activity.new_value)
                      : "Unassigned"}
                  </span>
                </p>
              )}
              {(activity.activity_type === "title_updated" || activity.activity_type === "description_updated") && (
                <p className="text-xs text-muted-foreground mt-1">
                  {activity.old_value && <><span className="line-through">{activity.old_value.length > 60 ? activity.old_value.slice(0, 60) + "…" : activity.old_value}</span>{" → "}</>}
                  <span className="font-medium text-foreground">{activity.new_value && activity.new_value.length > 60 ? activity.new_value.slice(0, 60) + "…" : activity.new_value}</span>
                </p>
              )}
              {activity.activity_type === "comment" && activity.new_value && (
                <p className="mt-1 text-sm text-muted-foreground rounded-md bg-muted/50 px-3 py-2">
                  {activity.new_value}
                  {activity.new_value.length >= 100 && "…"}
                </p>
              )}

              <p className="text-xs text-muted-foreground/60 mt-1">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActivityTimeline;
