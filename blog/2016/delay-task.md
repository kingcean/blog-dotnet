In some of textbox, it will render a dropdown list to show the suggestion when we are typing. Maybe you will think it imposes additional cost for network and server computing if the data is resolved from web service because perhaps user will ignore the information before complete a series characters typing of what the user want. A better way is to merge the requests to send the last one and ignore the ones when user are typing.

But how to implement it?

We will design a delay task with following goals to handle this.

- Generates a task to control when to run a given handler.
- Process the handler after a specific time span when the task starts.
- The task can be run by several times.
- Auto merge and ignore the previous ones if the task runs again after a short while.

In fact, the above is one of scenarios for usage. We can use this for lots of things. But how should we implement it?

Firstly, we need add some references for using.

```csharp
using System;
using System.Threading;
using System.Threading.Tasks;
```

Then we can define a class with a property to set the timeout span and an event for registering the one which will be occurred after the task processing. An async method is provided to call to process the task after the specific time span.

```csharp
public class DelayTask
{
    public TimeSpan Span { get; set; }
 
    public event EventHandler Processed;
 
    public async Task<bool> Process()
    {
        throw new NotImplementedException();
    }
}
```

In process method, we need delay to execute and raise the event. To ignore the processing of the ones raised before the previous one finished, we need add a token to check.

```csharp
private Guid _token = Guid.Empty;
```

The token should be generated, checked and cleared during processing. The result is a status indicating whether it executes.

```csharp
public async Task<bool> Process()
{
    var token = Guid.NewGuid();
    _token = token;
    await Task.Delay(Span);
    if (token != _token) return false;
    _token = Guid.Empty;
    Processed(this, new EventArgs());
    return true;
}
```

And add a cancellable process method. Now we get the following task.

```csharp
/// <summary>
/// The delay task.
/// </summary>
public class DelayTask
{
    private Guid _token = Guid.Empty;
 
    /// <summary>
    /// Gets or sets the delay time span.
    /// </summary>
    public TimeSpan Span { get; set; }
 
    /// <summary>
    /// Adds or removes the event handler occurred
    /// after processed.
    /// </summary>
    public event EventHandler Processed;
 
    /// <summary>
    /// Processes the delay task.
    /// </summary>
    /// <returns>
    /// A task with a value indicating whether it executes.
    /// </returns>
    public async Task<bool> Process()
    {
        return await Process(CancellationToken.None);
    }
 
    /// <summary>
    /// Processes the delay task.
    /// </summary>
    /// <param name="cancellationToken">
    /// The cancellation token that will be checked prior
    /// to completing the returned task.
    /// </param>
    /// <returns>
    /// A task with a value indicating whether it executes.
    /// </returns>
    public async Task<bool> Process(
        CancellationToken cancellationToken)
    {
        var token = Guid.NewGuid();
        _token = token;
        await Task.Delay(Span, cancellationToken);
        if (token != _token) return false;
        _token = Guid.Empty;
        if (cancellationToken.IsCancellationRequested)
            return false;
        Processed(this, new EventArgs());
        return true;
    }
}
```

To use it, you just need create an instance of this class with delay time span and call its process member method where you need execute the task. You can also register the event handler for processing.

<!-- End -->
---

Originally published on MSDN blogs, _Delay Task_.

> https://blogs.msdn.com/b/kingcean/archive/2016/03/20/delay-task.aspx

(cc) Kingcean Tuan, 2016.
