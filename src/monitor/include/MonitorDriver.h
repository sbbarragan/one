/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

#ifndef MONITOR_DRIVER_H_
#define MONITOR_DRIVER_H_

#include "Driver.h"
#include "Message.h"
#include "MonitorDriverMessages.h"
#include "MonitorDriverProtocol.h"


class MonitorDriver : public Driver<MonitorDriverMessages>
{
public:
    using message_t = Message<MonitorDriverMessages>;

    MonitorDriver(const std::string& c, const std::string& a, int ct):
        Driver<MonitorDriverMessages>(c, a, ct)
    {
        register_action(MonitorDriverMessages::UNDEFINED,
                &MonitorDriverProtocol::_undefined);

        register_action(MonitorDriverMessages::MONITOR_VM,
                &MonitorDriverProtocol::_monitor_vm);

        register_action(MonitorDriverMessages::MONITOR_HOST,
                &MonitorDriverProtocol::_monitor_host);

        register_action(MonitorDriverMessages::SYSTEM_HOST,
                &MonitorDriverProtocol::_system_host);

        register_action(MonitorDriverMessages::STATE_VM,
                &MonitorDriverProtocol::_state_vm);
    };

    void start_monitor(int oid, const std::string& host_xml)
    {
        message_t msg;

        msg.type(MonitorDriverMessages::START_MONITOR);
        msg.oid(oid);
        msg.payload(host_xml);

        write(msg);
    }

    void stop_monitor(int oid, const std::string& host_xml)
    {
        message_t msg;

        msg.type(MonitorDriverMessages::STOP_MONITOR);
        msg.oid(oid);
        msg.payload(host_xml);

        write(msg);
    }
};

#endif // MONITOR_DRIVER_H_