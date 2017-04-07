We always need process a business logic after a multiple hit such as double or more click event. And sometimes there is no such event handler to register so that we need find a way to do so. One of solutions is to design a task including following goals.

- Can register a handler to process after a multiple hit.
- The task can be run anywhere including in the event such as click.
- It executes the handler only when the task is run by the given times.
- The hit count will be reset if it is timeout after previous running.

We need implement a class to provide a member method to process anywhere. The method should return a value indicating whether the context condition is matched. User can set start index, end index and timeout.

```csharp
public class MultipleHitTask
{
    public int Start
    { get; set; }
 
    public int End
    { get; set; }
 
    public TimeSpan Timeout
    { get; private set; }
 
    public DateTime LatestProcess
    { get; private set; }
 
    public int HitCount
    { get; private set; }
 
    public event EventHandler Processed;
 
    public bool Process()
    {
        throw new NotImplementedException();
    }
}
```

The event is used to register to occur so that user can add the handler. The current index should be provided.

```csharp
/// <summary>
/// The event arguments with counting.
/// </summary>
public class IndexEventArgs: EventArgs
{
    /// <summary>
    /// Gets the index.
    /// </summary>
    public int Index { get; private set; }
 
    /// <summary>
    /// Initializes a new instance
    /// of the IndexEventArgs class.
    /// </summary>
    /// <param name="index">The index.</param>
    public IndexEventArgs(int index)
    {
        Index = index;
    }
}
```

So the event in the class should also update like this way.

```csharp
public event EventHandler<IndexEventArgs> Processed;
```

In the process method, we should execute the handler.

```csharp
var args = new IndexEventArgs(HitCount - 1);
Processed(this, args);
return true;
```

And we need add the checking logic.

```csharp
var now = DateTime.Now;
if (LatestProcess == null || now - LatestProcess > Timeout)
{
    HitCount = 0;
}

HitCount++;
if (HitCount <= Start || HitCount > End)
    return false;
```

So following is the class.

```csharp
/// <summary>
/// Multiple hit task.
/// </summary>
public class MultipleHitTask
{
    /// <summary>
    /// Gets or sets the start index of hit to process.
    /// </summary>
    public int Start { get; set; }
 
    /// <summary>
    /// Gets or sets the end index of hit to process.
    /// </summary>
    public int End { get; set; }
 
    /// <summary>
    /// Gets the timeout.
    /// </summary>
    public TimeSpan Timeout { get; private set; }
 
    /// <summary>
    /// Gets the time of latest processing.
    /// </summary>
    public DateTime LatestProcess { get; private set; }
 
    /// <summary>
    /// Gets the hit count.
    /// </summary>
    public int HitCount { get; private set; }
 
    /// <summary>
    /// Adds or removes the event handler occured
    /// after processing
    /// </summary>
    public event EventHandler<IndexEventArgs> Processed;
 
    /// <summary>
    /// Processes the task.
    /// </summary>
    /// <returns>true if match the condition to execute;
    /// otherwise, false.</returns>
    public bool Process()
    {
        var now = DateTime.Now;
        if (LatestProcess == null || now - LatestProcess > Timeout)
        {
            HitCount = 0;
        }
 
        HitCount++;
        if (HitCount <= Start || HitCount > End)
            return false;
        var args = new IndexEventArgs(HitCount - 1);
        Processed(this, args);
        return true;
    }
}
```

You can create an instance of this class and register the event handler. Then execute process member method anywhere.
