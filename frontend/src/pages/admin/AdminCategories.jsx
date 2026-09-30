import ResourcePage from '../../components/admin/ResourcePage';
export default function AdminCategories(){return <ResourcePage title="Categories" endpoint="/admin/categories" fields={[{key:'name',label:'Name',required:true}]} columns={[{key:'name',label:'Category'}]}/>}
