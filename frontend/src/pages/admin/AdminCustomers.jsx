import ResourcePage from '../../components/admin/ResourcePage';
export default function AdminCustomers(){return <ResourcePage title="Customers" endpoint="/admin/users?role=customer" moderation columns={[{key:'name',label:'Name'},{key:'email',label:'Email'},{key:'phone',label:'Phone'},{key:'status',label:'Status'}]}/>}
