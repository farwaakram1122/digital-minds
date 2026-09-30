import ResourcePage from '../../components/admin/ResourcePage';
export default function AdminFarmers(){return <ResourcePage title="Farmers" endpoint="/admin/users?role=farmer" moderation columns={[{key:'business',label:'Business'},{key:'name',label:'Contact'},{key:'email',label:'Email'},{key:'status',label:'Status'}]}/>}
