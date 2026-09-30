import ResourcePage from '../../components/admin/ResourcePage';
export default function AdminAnnouncements(){return <ResourcePage title="Announcements" endpoint="/admin/announcements" fields={[{key:'title',label:'Title',required:true},{key:'message',label:'Message',required:true}]} columns={[{key:'title',label:'Title'},{key:'message',label:'Message'}]}/>}
