document.addEventListener('DOMContentLoaded', function() {  
  // Event listeners for toggling views  
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));  
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));  
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));  
  document.querySelector('#compose').addEventListener('click', compose_email);  
  document.querySelector('#compose-form').addEventListener('submit', send_email);  

  // Load the inbox by default  
  load_mailbox('inbox');  
});  

function compose_email() {  
  // Show compose view and hide other views  
  document.querySelector('#emails-view').style.display = 'none';  
  document.querySelector('#compose-view').style.display = 'block';  
  document.querySelector('#email-details').style.display = "none"; // Ensure email details are hidden  
 
  

  // Clear the composition fields  
  document.querySelector('#compose-recipients').value = '';  
  document.querySelector('#compose-subject').value = '';  
  document.querySelector('#compose-body').value = ''; 
  
} 
function view_email(id) {  
    fetch(`/emails/${id}`)  
        .then(response => response.json())  
        .then(email => {  
            console.log(email);  

            // Display email details and hide others  
            document.querySelector('#emails-view').style.display = 'none';  
            document.querySelector('#compose-view').style.display = 'none';  
            document.querySelector('#email-details').style.display = 'block'; // Show email details  

            // Populate email details  
            document.querySelector('#email-details').innerHTML = `  
                <ul class="list-group">  
                    <h6>Sender: ${email.sender}</h6>  
                    <h6>To: ${email.recipients.join(', ')}</h6>  
                    <h6>Subject: ${email.subject}</h6>  
                    <p>${email.body}</p>  
                    <p><small>${email.timestamp}</small></p>  
                </ul>  
            `;  

            // Mark email as read if it is unread  
            if (!email.read) {  
                fetch(`/emails/${email.id}`, {  
                    method: 'PUT',  
                    body: JSON.stringify({ read: true })  
                }).then(() => {  
                    // Change the background color of the email in the inbox  
                    const emailDiv = document.querySelector(`div[email-details="${email.id}"]`);  
                    if (emailDiv) {  
                        emailDiv.style.backgroundColor = 'grey'; // Change background color to grey  
                    }  
                });  
            }  

            // Create Archive/Unarchive button  
            const arch = document.createElement('button');  
            arch.innerHTML = email.archived ? "Unarchive" : "Archive";  
            arch.className = email.archived ? "btn btn-light" : "btn btn-success";  
            arch.addEventListener('click', function() {  
                fetch(`/emails/${email.id}`, {  
                    method: 'PUT',  
                    body: JSON.stringify({ archived: !email.archived })  
                })  
                .then(() => { load_mailbox("archived"); });  
            });  
            
            document.querySelector('#email-details').append(arch);  
            
            // Create Reply button  
            const reply = document.createElement('button');  
            reply.innerHTML = "Reply";  
            reply.className = "btn btn-primary";  
            reply.addEventListener('click', function() {  
                compose_email();  
                document.querySelector('#compose-recipients').value = email.sender;  
                let subject = email.subject;  
                if (!subject.startsWith("Re: ")) {  
                    subject = "Re: " + subject;  
                }  
                document.querySelector('#compose-subject').value = subject;  
                document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;  
            });  
            
            document.querySelector('#email-details').append(reply);  
        });  
}  

function load_mailbox(mailbox) {  
    // Show the mailbox and hide other views  
    document.querySelector('#emails-view').style.display = 'block';  
    document.querySelector('#compose-view').style.display = 'none';  
    document.querySelector('#email-details').style.display = 'none'; // Ensure email details are hidden  

    // Show the mailbox name  
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;  

    fetch(`/emails/${mailbox}`)  
    .then(response => response.json())  
    .then(emails => {  
        const emailsView = document.querySelector('#emails-view');  
        // Clear previous emails  
        emailsView.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`; // Reset mailbox title  

        emails.forEach(email => {  
            const newEmail = document.createElement('div');  
            newEmail.setAttribute('email-details', email.id); // Set a data attribute for easy access  

            // Set background color based on read status  
            newEmail.style.backgroundColor = email.read ? 'grey' : 'white';  
            newEmail.style.padding = '10px'; // Optional: Add padding for better visual 
            newEmail.style.margin = '5px'; // Optional: Add margin for spacing 
             
            
            newEmail.innerHTML = `  
                <ul class="list-group">  
                    <li class="list-group-item">  
                        <h6>Sender: ${email.sender}</h6>  
                        <h4>Subject: ${email.subject}</h4>  
                        <p>${email.timestamp}</p>  
                    </li>  
                </ul>  
            `;  

            newEmail.addEventListener('click', function() {  
                view_email(email.id);  
            });  

            emailsView.append(newEmail);  
        });  
    });  
} 
 


function send_email(event) {  
  event.preventDefault();  
  
  const recipients = document.querySelector('#compose-recipients').value;  
  const subject = document.querySelector('#compose-subject').value;  
  const body = document.querySelector('#compose-body').value;  

  fetch('/emails', {  
      method: 'POST',  
      body: JSON.stringify({  
          recipients: recipients,  
          subject: subject,  
          body: body  
      })  
  })  
  .then(response => response.json())  
  .then(result => {  
      if (result.message) {  
          load_mailbox('sent'); // Load sent mailbox on successful send  
      } else {  
          alert('Failed to send email: ' + result.error);  
      }  
  })  
  .catch(error => console.error('Error sending email:', error));  
}