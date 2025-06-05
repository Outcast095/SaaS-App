
import CompanionCard from "@/components/ComponentCards";
import CompanionsList from "@/components/CompanionsList";
import Cta from "@/components/CTA";
import {recentSessions} from "@/constants";


const Page = () => {
  return (
    <main>
      <h1 className='text-2xl underline'>Popular companions</h1>

     <section className='home-section'>
         <CompanionCard
             id="1"
             name="Neura the Brainy Explorer"
             topic="Neura Network of the Brain"
             subject="scince"
             duration={45}
             color={'#E5D0FF'}
             bookmarked={true}
         />
         <CompanionCard
             id="2"
             name="Countsy the Number Wizard"
             topic="Topic: Derivatives & Integrals"
             subject="Maths"
             duration={30}
             color={'#FFDA6E'}
             bookmarked={true}
         />
         <CompanionCard
             id="2"
             name="Verba the Vocabulary Builder"
             topic="Topic: English Literature "
             subject="Language"
             duration={30}
             color={'#BDE7FF'}
             bookmarked={true}
         />

     </section>

        <section className='home-section'>
            <CompanionsList
                title="Recently completed sessions"
                companions={recentSessions}
                classNames="w-2/3 max-lg:w-full"
            />
            <Cta/>
        </section>
    </main>
  )
}

export default Page