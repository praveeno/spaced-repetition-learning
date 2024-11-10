function TasksAI() {
  const todayListName = 'TEND';
  const threeDayListName = '3END';
  const weekEndListName = 'WEND';
  const monthEndListName = 'MEND';
  const qEndListName = 'QEND';

  const seq = [todayListName, threeDayListName, weekEndListName, monthEndListName, qEndListName];
  const seqCounter = [0, 3, 7, 30, 90].map((x) => x + 1); // skipping initial date

  let todayList;
  let threeDayList;
  let weekEndList;
  let monthEndList;
  let qEndList;

  const gtasks = Tasks.Tasklists.list();
  for (let x of gtasks.items) {
    switch(x.title) {
      case todayListName:
        todayList = x;
        break;
      case threeDayListName:
        threeDayList = x;
        break;
      case weekEndListName:
        weekEndList = x;
        break;
      case monthEndListName:
        monthEndList = x;
        break;
      case qEndListName:
        qEndList = x;
        break;
    }
  }
  const seqList = [todayList, threeDayList, weekEndList, monthEndList, qEndList].map(((list, i) => {
    if (list) return list;
    return Tasks.Tasklists.insert({"title": seq[i]})
  }));

  seqList.forEach((list, i) => {
    const tasks = Tasks.Tasks.list(list.id, { showCompleted: true, showHidden: true })
    for (let item of tasks.items) {
      const nextList = seqList[++i];
      if (item.completed && nextList) {
        moveTaskToSubtask(list.id, item.id, {parentTaskId: null, parentListId: nextList.id});
        updateTaskReminder(item, nextList.id, seqCounter[++i]);
      }
    }
  });
  Logger.log('Done');
}

function addQueryParam(url, paramName, param) {
  if (url.includes('?')) return url + `&${paramName}=${param}`;
  return url + `?${paramName}=${param}`;
}

function moveTaskToSubtask(taskListId, taskId, {parentTaskId, parentListId}) {
  var token = ScriptApp.getOAuthToken();

  var url = `https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}/move`;
  url = parentTaskId ? addQueryParam(url, 'parent', parentTaskId): url;
  url = parentListId ? addQueryParam(url, 'destinationTasklist', parentListId): url;

  var options = {
    method: 'post',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response);
  return data;
}

function updateTaskReminder(task, taskListId, counter) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + counter);
    const dueDateISOString = dueDate.toISOString();

    task.due =  dueDateISOString;
    task.status = 'needsAction';
    Tasks.Tasks.update(task, taskListId, task.id)
}


function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
      .setTitle('My HTML Page')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}