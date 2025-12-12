import { useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { KyleAvatar } from "@/components/KyleAvatar";
import { useKyleTasksAgent } from "@/hooks/useKyleTasksAgent";
import { AudioWaves } from "@/components/AudioWaves";
import { Clock, Bell, Trash2, CheckCircle2, AlarmClock, X } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  reminder_time: string | null;
  is_completed: boolean;
  priority: string;
  created_at: string;
}

interface Alarm {
  id: string;
  time: string;
  label: string;
  isActive: boolean;
}

const ALARM_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

const Productivity = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [isAlarmRinging, setIsAlarmRinging] = useState(false);
  const [ringingAlarm, setRingingAlarm] = useState<Alarm | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const handleAlarmSet = useCallback((alarm: { time: string; label: string }) => {
    const newAlarm: Alarm = {
      id: crypto.randomUUID(),
      time: alarm.time,
      label: alarm.label,
      isActive: true,
    };
    setAlarms(prev => [...prev, newAlarm]);
    toast({
      title: "⏰ Alarm Set",
      description: `${alarm.label} at ${alarm.time}`,
    });
  }, [toast]);

  const { isConnected, isSpeaking, toggleConversation } = useKyleTasksAgent(handleAlarmSet);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio(ALARM_SOUND_URL);
    audioRef.current.loop = true;
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Check for alarms
  useEffect(() => {
    const checkAlarms = () => {
      const now = format(currentTime, "HH:mm");
      
      alarms.forEach(alarm => {
        if (alarm.isActive && alarm.time === now && !isAlarmRinging) {
          // Trigger alarm
          setIsAlarmRinging(true);
          setRingingAlarm(alarm);
          
          if (audioRef.current) {
            audioRef.current.play().catch(console.error);
          }
          
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("⏰ Alarm!", {
              body: alarm.label,
              icon: "/favicon.png"
            });
          }
        }
      });
    };

    checkAlarms();
  }, [currentTime, alarms, isAlarmRinging]);

  const stopAlarm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsAlarmRinging(false);
    
    if (ringingAlarm) {
      setAlarms(prev => prev.map(a => 
        a.id === ringingAlarm.id ? { ...a, isActive: false } : a
      ));
    }
    setRingingAlarm(null);
  };

  const deleteAlarm = (id: string) => {
    setAlarms(prev => prev.filter(a => a.id !== id));
    toast({ title: "Alarm deleted" });
  };

  // Fetch tasks
  useEffect(() => {
    fetchTasks();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => fetchTasks()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Check for reminders
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      tasks.forEach(task => {
        if (task.reminder_time && !task.is_completed) {
          const reminderTime = new Date(task.reminder_time);
          const diff = Math.abs(now.getTime() - reminderTime.getTime());
          if (diff < 60000) { // Within 1 minute
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("Task Reminder", {
                body: task.title,
                icon: "/favicon.png"
              });
            }
            toast({
              title: "⏰ Reminder",
              description: task.title,
            });
          }
        }
      });
    };

    const reminderInterval = setInterval(checkReminders, 30000);
    return () => clearInterval(reminderInterval);
  }, [tasks, toast]);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching tasks:', error);
      return;
    }
    setTasks(data || []);
  };

  const toggleTaskComplete = async (taskId: string, isCompleted: boolean) => {
    const { error } = await supabase
      .from('tasks')
      .update({ is_completed: !isCompleted })
      .eq('id', taskId);
    
    if (error) {
      toast({ title: "Error updating task", variant: "destructive" });
      return;
    }
    
    fetchTasks();
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);
    
    if (error) {
      toast({ title: "Error deleting task", variant: "destructive" });
      return;
    }
    
    toast({ title: "Task deleted" });
    fetchTasks();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const filteredTasks = selectedDate
    ? tasks.filter(task => {
        if (!task.due_date) return false;
        const taskDate = new Date(task.due_date);
        return (
          taskDate.getDate() === selectedDate.getDate() &&
          taskDate.getMonth() === selectedDate.getMonth() &&
          taskDate.getFullYear() === selectedDate.getFullYear()
        );
      })
    : tasks;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Alarm Ringing Overlay */}
      {isAlarmRinging && ringingAlarm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center animate-pulse">
          <Card className="bg-card border-primary p-8 text-center max-w-md mx-4">
            <div className="text-6xl mb-4">⏰</div>
            <h2 className="text-2xl font-bold text-foreground mb-2">ALARM!</h2>
            <p className="text-xl text-primary mb-4">{ringingAlarm.label}</p>
            <p className="text-lg text-muted-foreground mb-6">{ringingAlarm.time}</p>
            <Button 
              size="lg" 
              className="w-full bg-primary hover:bg-primary/90"
              onClick={stopAlarm}
            >
              Stop Alarm
            </Button>
          </Card>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Clock */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Productivity</h1>
            <p className="text-muted-foreground">Manage your tasks with Kyle</p>
          </div>
          
          {/* Digital Clock */}
          <Card className="bg-card/50 border-primary/20 backdrop-blur-sm">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-primary" />
                <div className="text-3xl md:text-5xl font-mono font-bold text-primary glow-red-subtle">
                  {format(currentTime, "HH:mm:ss")}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2 text-center">
                {format(currentTime, "EEEE, MMMM d, yyyy")}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kyle Voice Control */}
          <Card className="bg-card/50 border-primary/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Voice Control
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <KyleAvatar 
                size="lg" 
                onClickOverride={toggleConversation}
                isConnectedOverride={isConnected}
                isSpeakingOverride={isSpeaking}
              />
              {isConnected && <AudioWaves isActive={isConnected} isSpeaking={isSpeaking} />}
              <p className="text-sm text-muted-foreground text-center">
                {isConnected 
                  ? (isSpeaking ? "Kyle is speaking..." : "Listening...") 
                  : "Tap Kyle to add tasks by voice"}
              </p>
              <div className="text-xs text-muted-foreground/70 text-center space-y-1">
                <p>"Add task [title] for tomorrow"</p>
                <p>"Set an alarm for 3pm"</p>
                <p>"Complete task [name]"</p>
                <p>"List my tasks"</p>
              </div>
            </CardContent>
          </Card>

          {/* Calendar */}
          <Card className="bg-card/50 border-primary/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Calendar</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border border-primary/20 pointer-events-auto"
                modifiers={{
                  hasTask: tasks
                    .filter(t => t.due_date)
                    .map(t => new Date(t.due_date!))
                }}
                modifiersStyles={{
                  hasTask: { backgroundColor: 'hsl(var(--primary) / 0.2)' }
                }}
              />
            </CardContent>
          </Card>

          {/* Tasks List */}
          <Card className="bg-card/50 border-primary/20 backdrop-blur-sm lg:row-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  Tasks
                </span>
                <Badge variant="secondary">{filteredTasks.length}</Badge>
              </CardTitle>
              {selectedDate && (
                <p className="text-sm text-muted-foreground">
                  {format(selectedDate, "MMMM d, yyyy")}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
              {filteredTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No tasks for this date. Talk to Kyle to add some!
                </p>
              ) : (
                filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3 rounded-lg border transition-all ${
                      task.is_completed 
                        ? 'bg-muted/30 border-muted opacity-60' 
                        : 'bg-card border-primary/20 hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={task.is_completed}
                        onCheckedChange={() => toggleTaskComplete(task.id, task.is_completed)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium ${task.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1 truncate">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                          {task.reminder_time && (
                            <Badge variant="outline" className="text-xs">
                              <Bell className="w-3 h-3 mr-1" />
                              {format(new Date(task.reminder_time), "HH:mm")}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => deleteTask(task.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Alarms Section */}
          <Card className="bg-card/50 border-primary/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlarmClock className="w-5 h-5 text-primary" />
                Alarms
                <Badge variant="secondary" className="ml-auto">{alarms.filter(a => a.isActive).length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[200px] overflow-y-auto">
              {alarms.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No alarms set. Ask Kyle to set one!
                </p>
              ) : (
                alarms.map((alarm) => (
                  <div
                    key={alarm.id}
                    className={`p-3 rounded-lg border flex items-center justify-between ${
                      alarm.isActive 
                        ? 'bg-card border-primary/30' 
                        : 'bg-muted/30 border-muted opacity-60'
                    }`}
                  >
                    <div>
                      <p className="font-mono text-lg text-primary">{alarm.time}</p>
                      <p className="text-sm text-muted-foreground">{alarm.label}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => deleteAlarm(alarm.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* All Tasks */}
          <Card className="bg-card/50 border-primary/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">All Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full border-primary/30 hover:bg-primary/10"
                onClick={() => setSelectedDate(undefined)}
              >
                View All Tasks ({tasks.length})
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Productivity;
