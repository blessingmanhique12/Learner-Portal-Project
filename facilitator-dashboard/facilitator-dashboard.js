import { db, auth } from "./firebase.js"; 

import { 

    collection, 

    addDoc, 

    getDocs, 

    query, 

    where, 

    serverTimestamp 

} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js"; 

 
import { 

    signOut 

} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js"; 

 

// 1. SHOW FACILITATOR NAME //

async function showFacilitator() { 

    const user = auth.currentUser; 

    if (!user) { 
        return; 
    } 

    const registrations = 

        collection(db, "registrations"); 


    const q = query( 

        registrations, 

        where("uid", "==", user.uid) 

    ); 

 
    const result = await getDocs(q); 


    result.forEach(function(doc) { 

        const facilitator = doc.data(); 

        document.getElementById( 

            "facilitatorName" 

        ).textContent = 

            facilitator.displayName; 


        document.getElementById( 

            "welcomeName" 

        ).textContent = 

            facilitator.displayName; 

    }); 

} 

 

// 2. CREATE TASK // 
 

async function createTask() { 

    const title =  prompt("Enter task title:"); 


    if (!title || title.trim() === "") { 

        alert("Please enter a task title."); 
        return; 
    } 


    const dueDate = 

        prompt("Enter due date:"); 

    if (!dueDate || dueDate.trim() === "") { 

        alert("Please enter a due date."); 

        return; 

    } 


    const user = auth.currentUser; 

    if (!user) { 

        alert("You must be logged in."); 
        return; 

    } 


    const task = { 
        title: title.trim(), 
        dueDate: dueDate.trim(), 
        category: "General", 
        type: "task", 
        priority: "medium", 
        completed: false, 
        createdBy: user.uid, 
        createdAt: serverTimestamp() 

    }; 

    try { 

        await addDoc( 

            collection(db, "tasks"), 

            task 

        ); 

 
        alert( 

            "Task created successfully!" 

        ); 

 
        loadTasks(); 

    } catch (error) { 

        console.error(error); 


        alert( 

            "Could not create the task." 

        ); 

    } 

} 

 
// 3. LOAD TASKS //

async function loadTasks() { 

    const result = await getDocs( 

        collection(db, "tasks") 

    ); 


    const taskList = 

        document.getElementById("taskList"); 

 
    let totalTasks = 0; 

    let completedTasks = 0; 


    taskList.innerHTML = ""; 


    result.forEach(function(doc) { 

        const task = doc.data(); 

        totalTasks++; 

        if (task.completed === true) { 

            completedTasks++; 

        } 

 
        const item = 

            document.createElement("div"); 

        item.className = 

            "task-item"; 

        item.innerHTML = ` 

            <h3> 

                ${task.title} 

            </h3> 


            <p> 

                Due: ${task.dueDate} 

            </p> 

 
            <p> 

                Priority: ${task.priority} 

            </p> 

        `; 

        taskList.appendChild(item); 

    }); 

 
    document.getElementById( 

        "totalTasks" 

    ).textContent = 

        totalTasks; 

    document.getElementById( 

        "completedTasks" 

    ).textContent = 

        completedTasks; 

 
    document.getElementById( 

        "outstandingTasks" 

    ).textContent = 

        totalTasks - completedTasks; 

 
    document.getElementById( 

        "taskOverviewCompleted" 

    ).textContent = 

        completedTasks; 

 
    if (totalTasks === 0) { 

        taskList.innerHTML = ` 

            <div class="empty-message"> 

                No tasks available yet. 

            </div> 
        `; 

    } 

} 

 

// 4. LOAD LEARNERS// 

async function loadLearners() { 

    const result = await getDocs( 

        collection(db, "registrations") 

    ); 

    const learnerList = 

        document.getElementById("learnerList"); 


    learnerList.innerHTML = ""; 

    let totalLearners = 0; 


    result.forEach(function(doc) { 

        const learner = doc.data(); 

 
        if (learner.role === "learner") { 

            totalLearners++; 

 
            const item = 

                document.createElement("tr"); 

 
            item.innerHTML = ` 

                <td> 

                    ${learner.displayName} 

                </td> 


                <td> 

                    ${learner.email} 

                </td> 

                <td> 

                    <button 

                        class="view-progress"> 

                        View Progress 

                    </button> 

                </td> 

            `; 


            learnerList.appendChild(item); 

        } 

    }); 

 
    document.getElementById( 

        "totalLearners" 

    ).textContent = 

        totalLearners; 


    if (totalLearners === 0) { 

        learnerList.innerHTML = ` 

            <tr> 
                <td colspan="3"> 

                    No learners available. 

                </td> 

            </tr> 

        `; 

    } 

} 

 

 

 


// 5. LOAD RESOURCES // 

async function loadResources() { 

    const result = await getDocs( 

        collection(db, "resources") 
    ); 

 
    const resourceList = 

        document.getElementById("resourceList"); 

    resourceList.innerHTML = ""; 

    let totalResources = 0; 

    result.forEach(function(doc) { 

        const resource = doc.data(); 

        totalResources++; 

        const item = 

            document.createElement("div"); 

        item.className = 

            "resource-item"; 

        item.innerHTML = ` 

            <h3> 

                ${resource.title} 

            </h3> 

            <p> 

                Type: ${resource.type} 

            </p> 


            <p> 

                ${resource.description} 

            </p> 


            <a 

                href="${resource.url}" 

                target="_blank" 

                rel="noopener noreferrer"> 

                Open Resource 
            </a> 

        `; 

        resourceList.appendChild(item); 

    }); 


    if (totalResources === 0) { 

        resourceList.innerHTML = ` 

            <div class="empty-message"> 

                No resources available yet. 

            </div> 
        `; 

    } 

} 


// 6. ADD RESOURCE //

async function addResource() { 
    const title = 

        prompt("Enter resource title:"); 

    if (!title || title.trim() === "") { 
        alert("Please enter a resource title."); 
        return; 
    } 


    const type = prompt("Enter resource type:"); 

    if (!type || type.trim() === "") { 

        alert("Please enter the resource type."); 
        return; 
    } 

    const url =  prompt("Enter resource URL:"); 

    if (!url || url.trim() === "") { 
        alert("Please enter the resource URL."); 
        return; 
    } 


    const description = prompt("Enter resource description:"); 

    const resource = { 

        title: title.trim(), 

        type: type.trim(), 

        url: url.trim(), 

        description: 

            description ? 

            description.trim() : 

            "" 
    }; 

 
    try { 

        await addDoc( 

            collection(db, "resources"), 

            resource 
        ); 


        alert( 

            "Resource added successfully!" 

        ); 

 
        loadResources(); 

    } catch (error) { 

        console.error(error); 

        alert( 

            "Could not add the resource." 

        ); 

    } 

} 


// 7. BUTTONS // 

const addTaskButton = 

    document.getElementById( 

        "addTaskButton" 

    ); 


if (addTaskButton) { 
    addTaskButton.addEventListener( 

        "click", 

        createTask 
    ); 

} 

 
const addResourceButton = 

    document.getElementById( 

        "addResourceButton" 

    ); 

 
if (addResourceButton) { 
    addResourceButton.addEventListener( 

        "click", 

        addResource 

    ); 

} 

 
const bookSessionButton = 

    document.getElementById( 

        "bookSessionButton" 

    ); 

 
if (bookSessionButton) { 

    bookSessionButton.addEventListener( 

        "click", 

        function() { 

            alert( 

                "Support session booking will be connected next." 
            ); 

        } 

    ); 

} 

 

const messageLearnersButton = 

    document.getElementById( 

        "messageLearnersButton" 

    ); 

 
if (messageLearnersButton) { 

    messageLearnersButton.addEventListener( 

        "click", 

        function() { 

            alert( 

                "Messaging will be connected next." 

            ); 

        } 

    ); 

} 

 

// 8. LOGOUT // 
 

const logoutButton = 

    document.getElementById( 

        "logoutButton" 

    ); 

if (logoutButton) {
    logoutButton.addEventListener( 

        "click", 

        async function(event) { 
            event.preventDefault(); 

            try { 

                await signOut(auth); 

                window.location.href = 

                    "login.html"; 

            } catch (error) { 

                console.error(error); 

                alert( 

                    "Could not log out." 

                ); 

            } 

        } 

    ); 

} 
 

// 9. PAGE LOAD // 

auth.onAuthStateChanged( 

    async function(user) { 

        if (!user) { 
            window.location.href = 

                "login.html"; 
            return; 

        } 


        try { 

            await showFacilitator(); 

            await loadTasks(); 

            await loadLearners(); 

            await loadResources(); 


        } catch (error) { 

            console.error(error); 

            alert( 

                "There was a problem loading the dashboard." 

            ); 

        } 

    } 

); 