import ResourcePage from '../../components/admin/ResourcePage';
export default function AdminProducts(){return <ResourcePage title="Products" endpoint="/admin/products" readOnly columns={[{key:'name',label:'Name'},{key:'category',label:'Category'},{key:'price',label:'Price'},{key:'stock',label:'Stock'}]}/>}
