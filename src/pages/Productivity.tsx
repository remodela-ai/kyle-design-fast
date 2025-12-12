import { useState, useEffect, useCallback, useRef } from "react";
import { format, addMinutes } from "date-fns";
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
import { Clock, Bell, Trash2, CheckCircle2, AlarmClock, X, Timer, Repeat, CalendarDays, Volume2 } from "lucide-react";

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
  is_active: boolean;
  recurrence: string | null;
  recurrence_days: string[] | null;
}

const ALARM_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";
const TASK_NOTIFICATION_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3"; // pip pip pip beep
const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const Productivity = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [isAlarmRinging, setIsAlarmRinging] = useState(false);
  const [ringingAlarm, setRingingAlarm] = useState<Alarm | null>(null);
  const [triggeredAlarmIds, setTriggeredAlarmIds] = useState<Set<string>>(new Set());
  const [isReadingTask, setIsReadingTask] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const taskNotificationRef = useRef<HTMLAudioElement | null>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const fetchAlarms = useCallback(async () => {
    const { data, error } = await supabase
      .from('alarms')
      .select('*')
      .order('time', { ascending: true });
    
    if (error) {
      console.error('Error fetching alarms:', error);
      return;
    }
    setAlarms(data || []);
  }, []);

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

  const { isConnected, isSpeaking, isProcessingCommand, toggleConversation } = useKyleTasksAgent(fetchAlarms, fetchTasks);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio(ALARM_SOUND_URL);
    audioRef.current.loop = true;
    taskNotificationRef.current = new Audio(TASK_NOTIFICATION_SOUND_URL);
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (taskNotificationRef.current) {
        taskNotificationRef.current.pause();
        taskNotificationRef.current = null;
      }
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
        ttsAudioRef.current = null;
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

  // Reset triggered alarms at minute change
  useEffect(() => {
    const seconds = currentTime.getSeconds();
    if (seconds === 0) {
      setTriggeredAlarmIds(new Set());
    }
  }, [currentTime]);

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Fetch alarms on mount and subscribe to realtime
  useEffect(() => {
    fetchAlarms();
    
    const channel = supabase
      .channel('alarms-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'alarms' },
        () => fetchAlarms()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAlarms]);

  // Check if alarm should trigger based on recurrence
  const shouldAlarmTrigger = (alarm: Alarm): boolean => {
    const now = format(currentTime, "HH:mm");
    if (alarm.time !== now || !alarm.is_active) return false;
    
    // Already triggered this minute
    if (triggeredAlarmIds.has(alarm.id)) return false;
    
    const recurrence = alarm.recurrence || 'none';
    
    if (recurrence === 'none') return true;
    if (recurrence === 'daily') return true;
    if (recurrence === 'weekly' && alarm.recurrence_days) {
      const todayName = DAYS_OF_WEEK[currentTime.getDay()];
      return alarm.recurrence_days.includes(todayName);
    }
    
    return true;
  };

  // Check for alarms
  useEffect(() => {
    const checkAlarms = () => {
      alarms.forEach(alarm => {
        if (shouldAlarmTrigger(alarm) && !isAlarmRinging) {
          setTriggeredAlarmIds(prev => new Set(prev).add(alarm.id));
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

  const stopAlarm = async () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsAlarmRinging(false);
    
    if (ringingAlarm) {
      const recurrence = ringingAlarm.recurrence || 'none';
      
      // Only deactivate if it's not recurring
      if (recurrence === 'none') {
        await supabase
          .from('alarms')
          .update({ is_active: false })
          .eq('id', ringingAlarm.id);
      }
      // Recurring alarms stay active
    }
    setRingingAlarm(null);
  };

  const snoozeAlarm = async () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsAlarmRinging(false);
    
    if (ringingAlarm) {
      const newTime = format(addMinutes(currentTime, 5), "HH:mm");
      
      // For recurring alarms, create a temporary one-time snooze alarm
      const recurrence = ringingAlarm.recurrence || 'none';
      
      if (recurrence !== 'none') {
        // Create a temporary alarm for snooze
        await supabase
          .from('alarms')
          .insert({
            time: newTime,
            label: `${ringingAlarm.label} (snoozed)`,
            is_active: true,
            recurrence: 'none',
          });
      } else {
        await supabase
          .from('alarms')
          .update({ time: newTime })
          .eq('id', ringingAlarm.id);
      }
      
      toast({
        title: "Snoozed",
        description: `Alarm will ring again at ${newTime}`,
      });
    }
    setRingingAlarm(null);
  };

  const deleteAlarm = async (id: string) => {
    const { error } = await supabase
      .from('alarms')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({ title: "Error deleting alarm", variant: "destructive" });
      return;
    }
    toast({ title: "Alarm deleted" });
  };

  const toggleAlarmActive = async (id: string, currentState: boolean) => {
    await supabase
      .from('alarms')
      .update({ is_active: !currentState })
      .eq('id', id);
  };

  const getRecurrenceIcon = (alarm: Alarm) => {
    const recurrence = alarm.recurrence || 'none';
    if (recurrence === 'daily') return <Repeat className="w-3 h-3" />;
    if (recurrence === 'weekly') return <CalendarDays className="w-3 h-3" />;
    return null;
  };

  const getRecurrenceLabel = (alarm: Alarm) => {
    const recurrence = alarm.recurrence || 'none';
    if (recurrence === 'daily') return 'Daily';
    if (recurrence === 'weekly' && alarm.recurrence_days) {
      const shortDays = alarm.recurrence_days.map(d => d.slice(0, 3).toUpperCase());
      return shortDays.join(', ');
    }
    return null;
  };

  // Fetch tasks
  useEffect(() => {
    fetchTasks();
    
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

  // Check for reminders and play notification sound
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      tasks.forEach(task => {
        if (task.reminder_time && !task.is_completed) {
          const reminderTime = new Date(task.reminder_time);
          const diff = Math.abs(now.getTime() - reminderTime.getTime());
          if (diff < 60000) {
            // Play pip pip pip notification sound
            if (taskNotificationRef.current) {
              taskNotificationRef.current.play().catch(console.error);
            }
            
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

  // Read task with TTS
  const readTaskWithTTS = async (task: Task) => {
    if (isReadingTask) {
      // Stop current reading
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
        ttsAudioRef.current = null;
      }
      setIsReadingTask(null);
      return;
    }

    setIsReadingTask(task.id);
    
    try {
      const textToRead = task.description 
        ? `${task.title}. ${task.description}` 
        : task.title;

      const { data, error } = await supabase.functions.invoke('read-task-tts', {
        body: { text: textToRead }
      });

      if (error) throw error;

      const audioBlob = new Blob([data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      ttsAudioRef.current = new Audio(audioUrl);
      
      ttsAudioRef.current.onended = () => {
        setIsReadingTask(null);
        URL.revokeObjectURL(audioUrl);
      };
      
      await ttsAudioRef.current.play();
    } catch (err) {
      console.error('Error reading task:', err);
      toast({
        title: "Error reading task",
        description: "Could not generate audio",
        variant: "destructive"
      });
      setIsReadingTask(null);
    }
  };

  // fetchTasks is defined above with useKyleTasksAgent

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
            <p className="text-xl text-primary mb-2">{ringingAlarm.label}</p>
            <p className="text-lg text-muted-foreground mb-2">{ringingAlarm.time}</p>
            {getRecurrenceLabel(ringingAlarm) && (
              <Badge variant="outline" className="mb-4">
                {getRecurrenceIcon(ringingAlarm)}
                <span className="ml-1">{getRecurrenceLabel(ringingAlarm)}</span>
              </Badge>
            )}
            <div className="flex gap-3 mt-4">
              <Button 
                size="lg" 
                variant="outline"
                className="flex-1 border-primary/50 hover:bg-primary/10"
                onClick={snoozeAlarm}
              >
                <Timer className="w-5 h-5 mr-2" />
                Snooze 5 min
              </Button>
              <Button 
                size="lg" 
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={stopAlarm}
              >
                Stop
              </Button>
            </div>
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
                {isProcessingCommand 
                  ? "Processing command..." 
                  : isConnected 
                    ? (isSpeaking ? "Kyle is speaking..." : "Listening...") 
                    : "Tap Kyle to add tasks by voice"}
              </p>
              <div className="text-xs text-muted-foreground/70 text-center space-y-1">
                <p>"Add task [title] for tomorrow"</p>
                <p>"Set a daily alarm for 7am"</p>
                <p>"Set alarm for Monday and Friday at 9am"</p>
                <p>"Complete task [name]"</p>
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
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`text-muted-foreground hover:text-primary ${isReadingTask === task.id ? 'text-primary animate-pulse' : ''}`}
                          onClick={() => readTaskWithTTS(task)}
                          title="Read task with Kyle's voice"
                        >
                          <Volume2 className="w-4 h-4" />
                        </Button>
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
                <Badge variant="secondary" className="ml-auto">{alarms.filter(a => a.is_active).length}</Badge>
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
                      alarm.is_active 
                        ? 'bg-card border-primary/30' 
                        : 'bg-muted/30 border-muted opacity-60'
                    }`}
                  >
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => toggleAlarmActive(alarm.id, alarm.is_active)}
                    >
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-lg text-primary">{alarm.time}</p>
                        {getRecurrenceLabel(alarm) && (
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            {getRecurrenceIcon(alarm)}
                            {getRecurrenceLabel(alarm)}
                          </Badge>
                        )}
                      </div>
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
