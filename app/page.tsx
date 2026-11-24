import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRoot,
  TableRow,
} from "@/components/Table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Tabs";

const data = [
  {
    workspace: "sales_by_day_api",
    owner: "John Doe",
    status: "Live",
    costs: "$3,509.00",
    region: "US-West 1",
    capacity: "99%",
    lastEdited: "23/09/2023 13:00",
  },
  {
    workspace: "marketing_campaign",
    owner: "Jane Smith",
    status: "Live",
    costs: "$5,720.00",
    region: "US-East 2",
    capacity: "80%",
    lastEdited: "22/09/2023 10:45",
  },
  {
    workspace: "test_environment",
    owner: "David Clark",
    status: "Inactive",
    costs: "$800.00",
    region: "EU-Central 1",
    capacity: "40%",
    lastEdited: "25/09/2023 16:20",
  },
  {
    workspace: "sales_campaign",
    owner: "Jane Smith",
    status: "Live",
    costs: "$5,720.00",
    region: "US-East 2",
    capacity: "80%",
    lastEdited: "22/09/2023 10:45",
  },
  {
    workspace: "development_env",
    owner: "Mike Johnson",
    status: "Inactive",
    costs: "$4,200.00",
    region: "EU-West 1",
    capacity: "60%",
    lastEdited: "21/09/2023 14:30",
  },
  {
    workspace: "new_workspace_1",
    owner: "Alice Brown",
    status: "Inactive",
    costs: "$2,100.00",
    region: "US-West 2",
    capacity: "75%",
    lastEdited: "24/09/2023 09:15",
  },
];

function DataTable() {
  return (
    <>
      <div className="sm:flex sm:items-center sm:justify-between sm:space-x-10">
        <div>
          <h3 className="font-semibold">
            Workspaces
          </h3>
          <p className="mt-1 text-sm/6 text-ink-detail">
            Overview of all registered workspaces within your organization.
          </p>
        </div>
        <Button className="mt-4 w-full sm:mt-0 sm:w-fit">Add workspace</Button>
      </div>
      <TableRoot className="mt-8">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Workspace</TableHeaderCell>
              <TableHeaderCell>Owner</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Region</TableHeaderCell>
              <TableHeaderCell>Capacity</TableHeaderCell>
              <TableHeaderCell className="text-right">Costs</TableHeaderCell>
              <TableHeaderCell className="text-right">
                Last edited
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((item) => (
              <TableRow
                key={item.workspace}
                className="even:bg-surface-faint"
              >
                <TableCell className="font-medium text-ink">
                  {item.workspace}
                </TableCell>
                <TableCell>{item.owner}</TableCell>
                <TableCell>{item.status}</TableCell>
                <TableCell>{item.region}</TableCell>
                <TableCell>{item.capacity}</TableCell>
                <TableCell className="text-right">{item.costs}</TableCell>
                <TableCell className="text-right">{item.lastEdited}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableRoot>
    </>
  );
}

function ContentPlaceholder() {
  return (
    <div className="relative h-full overflow-hidden rounded bg-gray-3">
      <svg
        className="absolute inset-0 h-full w-full stroke-gray-a5"
        fill="none"
      >
        <defs>
          <pattern
            id="pattern-1"
            x="0"
            y="0"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <path d="M-3 13 15-5M-5 5l18-18M-1 21 17 3"></path>
          </pattern>
        </defs>
        <rect
          stroke="none"
          fill="url(#pattern-1)"
          width="100%"
          height="100%"
        ></rect>
      </svg>
    </div>
  );
}

export default function Page() {
  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8">
        <header>
          <div className="sm:flex sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              Report
            </h3>
            <div className="mt-4 sm:mt-0 sm:flex sm:items-center sm:space-x-2">
              <Select defaultValue="1">
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="1">Today</SelectItem>
                  <SelectItem value="2">Last 7 days</SelectItem>
                  <SelectItem value="3">Last 4 weeks</SelectItem>
                  <SelectItem value="4">Last 12 months</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="1">
                <SelectTrigger className="mt-2 w-full sm:mt-0 sm:w-36">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="1">US-West</SelectItem>
                  <SelectItem value="2">US-East</SelectItem>
                  <SelectItem value="3">EU-Central-1</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </header>
        <main>
          <Tabs defaultValue="1" className="mt-6">
            <TabsList>
              <TabsTrigger value="1">Overview</TabsTrigger>
              <TabsTrigger value="2">Detail</TabsTrigger>
            </TabsList>
            <TabsContent value="1" className="mt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Card className="h-36 p-2">
                  <ContentPlaceholder />
                </Card>
                <Card className="h-36 p-2">
                  <ContentPlaceholder />
                </Card>
                <Card className="h-36 p-2">
                  <ContentPlaceholder />
                </Card>
                <Card className="h-36 p-2">
                  <ContentPlaceholder />
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="2" className="mt-4">
              <Card className="p-3">
                {/*<ContentPlaceholder />*/}
                <DataTable/>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  );
}
