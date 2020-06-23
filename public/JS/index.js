// for loader

function loading(){
    let load=document.querySelector('.loading');

    load.style.display="none";
}

// const btn=document.querySelector('#reqbtn');
// const reqform=document.querySelector('.reqblood');
// const cancel=document.querySelector('#cancel');

// cancel.addEventListener('click',function(){
//     reqform.style.visibility="hidden";
//     reqform.style.opacity="0";
// });
// btn.addEventListener('click',function(){
//     reqform.style.visibility="visible";
//     reqform.style.opacity="1";
// });

const fileupld=document.querySelector('#profile-img');
const filebtn=document.querySelector('#img-upload');

filebtn.addEventListener("change",function(){
    const file=this.files[0];

    if(file){
        const reader=new FileReader();

        reader.addEventListener("load",function(){
            fileupld.setAttribute("src",this.result);
        });

        reader.readAsDataURL(file);

    }else{

    }
});


$('#app-date').dateDropper();

$( "#alarm" ).timeDropper();